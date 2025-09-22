import { Job, Worker } from 'bullmq';
import { IDriver } from '../../interface/models/models';
import { DocumentVerificationService } from '../../utils/verificationServices';
import {
  DocumentStatusEnum,
  expiryDocumentTypeEnum,
  RestaurantVerificationStatusEnum,
} from '../../interface/enums/enums';
import { Driver } from '../../models/driver';
import { AppError } from '../../utils/appError';
import { findVehicleType } from '../../utils/helper';
import { DocumentApprovedHTML } from '../../utils/EmailTemplate/documentApproved';
import { emailQueue } from '../email/queue';
import { ExpiryDocumentQueue } from '../expiryDocument/queue';
import { reminderExpiredDocumentQueue } from '../reminderExpiryDocument/queue';
import { DocumentRejectedHTML } from '../../utils/EmailTemplate/documentRejected';
import { redisConnection } from '../../config/redisConfig';
import { getConfig } from '../../config/config';

interface vehicleValidatorJobData {
  userId: IDriver['_id'];
  documentUrl: string;
}

const config = getConfig();
const vehicleValidatorWorker = new Worker(
  'vehicleValidator',
  async (job: Job<vehicleValidatorJobData>) => {
    const { userId, documentUrl } = job.data;

    try {
      console.log('start processing document');
      const verifier = new DocumentVerificationService();
      const result =
        await verifier.verifyDriverVehicleRegisteration(documentUrl);

      let documentStatus: DocumentStatusEnum;
      let rejectionReason: string | null = null;
      const vehicleInfo: Record<string, any> = {};

      if (result.isValid) {
        documentStatus = DocumentStatusEnum.Verified;
      } else {
        documentStatus = DocumentStatusEnum.Rejected;
      }

      if (result.issues.length > 0) {
        rejectionReason = result.issues.join(',');
      }

      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (['make', 'model', 'color', 'plateNumber'].includes(key)) {
          vehicleInfo[key] = value;
        } else if (['bodyType'].includes(key)) {
          vehicleInfo['vehicleType'] = findVehicleType(value);
        }
      });

      console.log(vehicleInfo);

      // find driver
      const findDriver = await Driver.findById(userId);

      if (!findDriver) {
        throw new AppError("Can't find user", 404);
      }

      const updatedDriver = await Driver.findByIdAndUpdate(
        findDriver._id,
        {
          $set: {
            [`documents.vehicleRegistration.status`]: documentStatus,
            [`documents.vehicleRegistration.rejectionReason`]: rejectionReason,
            [`documents.vehicleRegistration.expiryDate`]: result.expiryDate,
            vehicleInfo: vehicleInfo,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedDriver) {
        throw new AppError('Unable to update restaurant at the moment', 400);
      }

      // notify the driver with email if there vehicle registeration document has been approved.
      // also schedule job to update document status to expired after the document expired and also reminder one month before their document expires

      if (result.isValid) {
        const html = DocumentApprovedHTML({
          username: findDriver.firstName,
          documentType: 'VehicleRegistrationDocument',
          year: new Date().getFullYear(),
        });

        await emailQueue.add('Document Approved', {
          to: findDriver.email,
          subject: 'Document verification',
          body: html,
          template: 'Document verification',
        });

        const oldJobId =
          updatedDriver.documents.vehicleRegistration.expiryJobId;

        if (oldJobId) {
          const oldJob = await ExpiryDocumentQueue.getJob(oldJobId);
          if (oldJob) {
            await oldJob.remove();
          }
        }

        const scheduleExpiryTask = await ExpiryDocumentQueue.add(
          'expiryDocumentTask',
          {
            documentType: expiryDocumentTypeEnum.vehicleRegistration,
            userType: 'Driver',
            driverId: findDriver._id,
          },
          {
            delay: new Date(result.expiryDate).getTime() - Date.now(),
          }
        );

        updatedDriver.documents.vehicleRegistration.expiryJobId =
          scheduleExpiryTask.id;
        await updatedDriver.save();

        const expiryDateValue =
          updatedDriver.documents.vehicleRegistration.expiryDate;

        const expiryDate = expiryDateValue ? new Date(expiryDateValue) : null;

        if (expiryDate !== null) {
          const oneMonthBeforeExpiryDate = new Date(
            expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000
          );

          const delay = oneMonthBeforeExpiryDate.getTime() - Date.now();

          if (delay > 0) {
            const oldRemiderJobId =
              updatedDriver.documents.vehicleRegistration.reminderJobId;

            if (oldRemiderJobId) {
              const olderReminderJob =
                await reminderExpiredDocumentQueue.getJob(oldRemiderJobId);

              if (olderReminderJob) {
                await olderReminderJob.remove();
              }
            }

            const reminderJob = await reminderExpiredDocumentQueue.add(
              'reminderExpiredDocument',
              {
                driverId: findDriver._id,
                documentType: expiryDocumentTypeEnum.vehicleRegistration,
                userType: 'Driver',
              },
              {
                delay: delay,
              }
            );

            updatedDriver.documents.vehicleRegistration.reminderJobId =
              reminderJob.id;

            await updatedDriver.save();
          }
        }

        //check if all the driver document status is approved and also setup ther wallet

        const checkAllDriverDocumentApproved = Object.entries(
          updatedDriver.documents
        ).every(([key, value]) => value.status === DocumentStatusEnum.Verified);

        if (checkAllDriverDocumentApproved && updatedDriver.walletSetup) {
          updatedDriver.verificationStatus =
            RestaurantVerificationStatusEnum.Approved;

          await updatedDriver.save();
        }
      } else {
        const html = DocumentRejectedHTML({
          username: findDriver.firstName,
          documentType: 'VehicleRegistrationDocument',
          rejectedReasons: result.issues,
          year: new Date().getFullYear(),
        });
        await emailQueue.add('Document Rejected', {
          to: findDriver.email,
          subject: 'Document verification',
          body: html,
          template: 'Document verification',
        });
      }
    } catch (error: any) {
      console.error(
        `Failed to validator document vehicle Registeration:`,
        error
      );
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: config.bullmq.concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

vehicleValidatorWorker.on('completed', (job) => {
  console.log(`document validator job ${job.id} completed successfully`);
});

vehicleValidatorWorker.on('failed', (job, err) => {
  console.error(`document validator job ${job?.id} failed:`, err);
});

vehicleValidatorWorker.on('progress', (job, progress) => {
  console.log(`document validator job ${job.id} progress: ${progress}%`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down document validator worker...');
  await vehicleValidatorWorker.close();
  await redisConnection.quit();
});

export { vehicleValidatorWorker };

import { Job, Worker } from 'bullmq';
import { IRestaurantOwner } from '../../interface/models/models';
import { IRestaurantMutation } from '../../interface/interface/interface';
import { DocumentVerificationService } from '../../utils/verificationServices';
import {
  DocumentStatusEnum,
  RestaurantDocumentTypeEnum,
  RestaurantVerificationStatusEnum,
} from '../../interface/enums/enums';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
import { Restaurant } from '../../models/restaurant';
import { AppError } from '../../utils/appError';
import { RestaurantOwner } from '../../models/restaurantOwner';
import { emailQueue } from '../email/queue';
import { DocumentApprovedHTML } from '../../utils/EmailTemplate/documentApproved';
import { DocumentRejectedHTML } from '../../utils/EmailTemplate/documentRejected';
import { ExpiryDocumentQueue } from '../expiryDocument/queue';
import { reminderExpiredDocumentQueue } from '../reminderExpiryDocument/queue';

interface documentValidatorJobData {
  userId: IRestaurantOwner['_id'];
  DocumentData: IRestaurantMutation['addRestaurantDocument'];
  businessName: string;
}

const documentValidatorWorker = new Worker(
  'documentValidator',
  async (job: Job<documentValidatorJobData>) => {
    const { userId, DocumentData, businessName } = job.data;

    try {
      const verifier = new DocumentVerificationService();
      let result = await (() => {
        switch (DocumentData.documentType) {
          case RestaurantDocumentTypeEnum.businessLicense:
            return verifier.verifyBusinessLicense(
              DocumentData.url,
              businessName
            );
          case RestaurantDocumentTypeEnum.taxCeritificate:
            return verifier.verifyTaxCertificate(DocumentData.url);
          case RestaurantDocumentTypeEnum.foodHandlerPermit:
            return verifier.verifyFoodHandlerPermit(
              DocumentData.url,
              businessName
            );
        }
      })();

      let documentStatus: DocumentStatusEnum;
      let rejectionReason: string | null = null;

      if (result.isValid) {
        documentStatus = DocumentStatusEnum.Approved;
      } else {
        documentStatus = DocumentStatusEnum.Rejected;
      }

      if (result.issues.length > 0) {
        rejectionReason = result.issues.join(',');
      }

      // find restaurant owner and return error if you can't find owner
      const findRestaurantOwner = await RestaurantOwner.findById(userId);

      if (!findRestaurantOwner) {
        throw new AppError("Can't find user", 404);
      }

      // updateing restaurant document after verification process, either it was approved or rejected
      const updatedRestaurant = await Restaurant.findOneAndUpdate(
        {
          owner: findRestaurantOwner._id,
        },
        {
          $set: {
            [`documents.${DocumentData.documentType}.status`]: documentStatus,
            [`documents.${DocumentData.documentType}.expiryDate`]:
              result.expiryDate,
            [`documents.${DocumentData.documentType}.rejectionReason`]:
              rejectionReason,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedRestaurant) {
        throw new AppError('Unable to update restaurant at the moment', 400);
      }

      // notify with email the owner that document has been approved,
      // also schedule task to update document status, when it's expires and also reminder email, when it's one month before the document expires

      if (result.isValid) {
        const html = DocumentApprovedHTML({
          username: findRestaurantOwner.firstName,
          documentType: DocumentData.documentType,
          year: new Date().getFullYear(),
        });

        // notify restaurant ownder that their document has been approved
        await emailQueue.add('Document Approved', {
          to: findRestaurantOwner.email,
          subject: 'Document verification',
          body: html,
          template: 'Document verification',
        });

        const oldJobId =
          updatedRestaurant.documents[DocumentData.documentType]?.expiryJobId;

        // remove previous expiryDocument job,if there is one
        if (oldJobId) {
          const oldJob = await ExpiryDocumentQueue.getJob(oldJobId);
          if (oldJob) {
            await oldJob.remove();
          }
        }

        // schedule task to update document status when it's expires
        const scheduleExpiryTask = await ExpiryDocumentQueue.add(
          'expiryDocumentTask',
          {
            restaurantId: updatedRestaurant._id,
            documentType: DocumentData.documentType,
            userType: 'RestaurantOwner',
          },
          {
            delay: new Date(result.expiryDate).getTime() - Date.now(),
          }
        );

        // update database with new expiry job Id

        updatedRestaurant.documents[DocumentData.documentType].expiryJobId =
          scheduleExpiryTask.id;

        await updatedRestaurant.save();

        // scheduling reminder task one month before document expires
        const expiryDateValue =
          updatedRestaurant.documents[DocumentData.documentType].expiryDate;
        const expiryDate = expiryDateValue ? new Date(expiryDateValue) : null;
        if (expiryDate !== null) {
          const oneMonthBeforeExpiryDate = new Date(
            expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000
          );

          const delay = oneMonthBeforeExpiryDate.getTime() - Date.now();

          if (delay > 0) {
            const oldReminderJobId =
              updatedRestaurant.documents[DocumentData.documentType]
                .reminderJobId;

            if (oldReminderJobId) {
              const oldReminderJob =
                await reminderExpiredDocumentQueue.getJob(oldReminderJobId);

              if (oldReminderJob) {
                await oldReminderJob.remove();
              }
            }

            const reminderJob = await reminderExpiredDocumentQueue.add(
              'reminderExpiredDocument',
              {
                restaurantId: updatedRestaurant._id,
                documentType: DocumentData.documentType,
                userType: 'RestaurantOwner',
              },
              {
                delay: delay,
              }
            );

            updatedRestaurant.documents[
              DocumentData.documentType
            ].reminderJobId = reminderJob.id;
            await updatedRestaurant.save();
          }
        }

        // check if all the restaurant document status is approved and also setup their wallet, wallet boolean is true, update their verification status

        const checkAllRestaurantDocumentIsApproved = Object.entries(
          updatedRestaurant.documents
        ).every(
          ([key, documentObject]) =>
            documentObject.status === DocumentStatusEnum.Approved
        );

        if (
          checkAllRestaurantDocumentIsApproved &&
          updatedRestaurant.walletSetup === true
        ) {
          updatedRestaurant.verificationStatus =
            RestaurantVerificationStatusEnum.Approved;
          updatedRestaurant.isLive = true;
          await updatedRestaurant.save();
        }
      } else {
        const html = DocumentRejectedHTML({
          username: findRestaurantOwner.firstName,
          documentType: DocumentData.documentType,
          rejectedReasons: result.issues,
          year: new Date().getFullYear(),
        });
        await emailQueue.add('Document Rejected', {
          to: findRestaurantOwner.email,
          subject: 'Document verification',
          body: html,
          template: 'Document verification',
        });
      }

      return { success: true, message: 'Verification process done' };
    } catch (error: any) {
      console.error(
        `Failed to validator document ${DocumentData.documentType}:`,
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

documentValidatorWorker.on('completed', (job) => {
  console.log(`document validator job ${job.id} completed successfully`);
});

documentValidatorWorker.on('failed', (job, err) => {
  console.error(`document validator job ${job?.id} failed:`, err);
});

documentValidatorWorker.on('progress', (job, progress) => {
  console.log(`document validator job ${job.id} progress: ${progress}%`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down document validator worker...');
  await documentValidatorWorker.close();
  await redisConnection.quit();
});

export { documentValidatorWorker };

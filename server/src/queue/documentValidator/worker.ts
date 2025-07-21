import { Job, Worker } from 'bullmq';
import { IRestaurantOwner } from '../../interface/models/models';
import { IRestaurantMutation } from '../../interface/interface/interface';
import { DocumentVerificationService } from '../../utils/verificationServices';
import {
  DocumentStatusEnum,
  RestaurantDocumentTypeEnum,
} from '../../interface/enums/enums';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
import { Restaurant } from '../../models/restaurant';
import { AppError } from '../../utils/appError';
import { RestaurantOwner } from '../../models/restaurantOwner';
import { emailQueue } from '../email/queue';
import { DocumentApprovedHTML } from '../../utils/EmailTemplate/documentApproved';
import { DocumentRejectedHTML } from '../../utils/EmailTemplate/documentRejected';

interface documentValidatorJobData {
  userId: IRestaurantOwner['_id'];
  DocumentData: IRestaurantMutation['addRestaurantDocument'];
}

const documentValidatorWorker = new Worker(
  'documentValidator',
  async (job: Job<documentValidatorJobData>) => {
    const { userId, DocumentData } = job.data;

    try {
      const verifier = new DocumentVerificationService();
      let result = await (() => {
        switch (DocumentData.documentType) {
          case RestaurantDocumentTypeEnum.businessLicense:
            return verifier.verifyBusinessLicense(DocumentData.url);
          case RestaurantDocumentTypeEnum.taxCeritificate:
            return verifier.verifyTaxCertificate(DocumentData.url);
          case RestaurantDocumentTypeEnum.foodHandlerPermit:
            return verifier.verifyFoodHandlerPermit(DocumentData.url);
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

      const findRestaurantOwner = await RestaurantOwner.findById(userId);

      if (!findRestaurantOwner) {
        throw new AppError("Can't find user", 404);
      }

      const findRestaurantAndUpdate = await Restaurant.findOneAndUpdate(
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
        }
      );

      if (!findRestaurantAndUpdate) {
        throw new AppError('Unable to update restaurant at the moment', 400);
      }

      if (result.isValid) {
        const html = DocumentApprovedHTML({
          username: findRestaurantOwner.firstName,
          documentType: DocumentData.documentType,
          year: new Date().getFullYear(),
        });
        await emailQueue.add('Document Approved', {
          to: findRestaurantOwner.email,
          subject: 'Document verification',
          body: html,
          template: 'Document verification',
        });
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
  await documentValidatorWorker.close();
  await redisConnection.quit();
});

export { documentValidatorWorker };

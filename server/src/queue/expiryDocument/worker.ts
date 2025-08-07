import { Job, Worker } from 'bullmq';
import {
  IDriver,
  IRestaurant,
  IRestaurantOwner,
} from '../../interface/models/models';
import { Restaurant } from '../../models/restaurant';
import mongoose from 'mongoose';
import {
  DocumentStatusEnum,
  expiryDocumentTypeEnum,
  RestaurantDocumentTypeEnum,
} from '../../interface/enums/enums';
import { AppError } from '../../utils/appError';
import { ExpiryDocumentHTML } from '../../utils/EmailTemplate/expiredDocument';
import { RestaurantOwner } from '../../models/restaurantOwner';
import { emailQueue } from '../email/queue';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';

interface ExpiryDocumentData {
  restaurantId?: IRestaurant['_id'];
  driverId?: IDriver['_id'];
  documentType: expiryDocumentTypeEnum;
  userType: 'Driver' | 'RestaurantOwner';
}

const expiryDocumentWorker = new Worker(
  'expiryDocument',
  async (job: Job<ExpiryDocumentData>) => {
    try {
      const { restaurantId, documentType, userType, driverId } = job.data;

      if (userType === 'RestaurantOwner') {
        const findRestaurant = await Restaurant.findOne({
          _id: new mongoose.Types.ObjectId(restaurantId),
        });

        if (!findRestaurant) {
          throw new AppError('Restaurant not found', 404);
        }

        // find restaurant owner information

        const findRestaurantOwner = await RestaurantOwner.findOne({
          ownedRestaurant: findRestaurant._id,
        });

        if (!findRestaurantOwner) {
          throw new AppError('Restaurant owner not found', 404);
        }

        // find the restaurant with the restaurant id and update document to expired and
        // also change restaurant verification to false, they are not able to take order
        // until they upload a validate document required to run their business

        const updateRestaurant = await Restaurant.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(restaurantId),
          },
          {
            $set: {
              [`documents.${documentType}.status`]: DocumentStatusEnum.Expired,
              verificationStatus: false,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!updateRestaurant) {
          throw new AppError('unable to update restaurant at the moment', 400);
        }

        // send email to restaurant owner, notify them that their document has expired
        const html = ExpiryDocumentHTML({
          ownerName: findRestaurantOwner.firstName,
          restaurantName: findRestaurant.name,
          expiryDate:
            findRestaurant.documents[
              `${documentType}` as RestaurantDocumentTypeEnum
            ].expiryDate?.toDateString(),
          documentType: documentType,
        });

        await emailQueue.add('ExpiryDocument', {
          to: findRestaurantOwner.email,
          subject: 'Document Expired',
          html,
          template: 'Document Expired',
        });

        return {
          success: true,
          message: 'Expired document status has been updated',
        };
      } else if (userType === 'Driver') {
      }
    } catch (error: any) {
      console.error(`Failed to update expiry document status:`, error);
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

expiryDocumentWorker.on('completed', (job) => {
  console.log(`document validator job ${job.id} compeleted successfully!`);
});

expiryDocumentWorker.on('failed', (job, err) => {
  console.log(`document validator job ${job?.id} failed:`, err);
});

expiryDocumentWorker.on('progress', (job, progress) => {
  console.log(`documet validator job ${job.id} progress:`, progress);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down expiry document worker...');
  await expiryDocumentWorker.close();
  await redisConnection.quit();
});

export { expiryDocumentWorker };

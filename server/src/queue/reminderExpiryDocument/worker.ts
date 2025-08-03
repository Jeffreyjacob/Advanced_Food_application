import { Job, Worker } from 'bullmq';
import { RestaurantDocumentTypeEnum } from '../../interface/enums/enums';
import { IRestaurant } from '../../interface/models/models';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';
import { Restaurant } from '../../models/restaurant';
import mongoose from 'mongoose';
import { AppError } from '../../utils/appError';
import { RestaurantOwner } from '../../models/restaurantOwner';
import { ReminderExpiredDocuments } from '../../utils/EmailTemplate/reminderExpiredDocument';
import { emailQueue } from '../email/queue';

interface ReminderDocumentExpiryData {
  restaurantId: IRestaurant['_id'];
  documentType: RestaurantDocumentTypeEnum;
}

const reminderExpiredDocumentWorker = new Worker(
  'reminderExpiredDocument',
  async (job: Job<ReminderDocumentExpiryData>) => {
    const { restaurantId, documentType } = job.data;

    try {
      // find restaurant

      const findRestaurant = await Restaurant.findOne({
        _id: new mongoose.Types.ObjectId(restaurantId),
      });

      if (!findRestaurant) {
        throw new AppError("restaurant can't be found", 404);
      }

      // find restaurant owner

      const findRestaurantOwner = await RestaurantOwner.findOne({
        ownedRestaurant: findRestaurant._id,
      });

      if (!findRestaurantOwner) {
        throw new AppError("restaurant ownder can't be found", 404);
      }

      // notify owner one month before the document expires

      const html = ReminderExpiredDocuments({
        ownerName: findRestaurantOwner.firstName,
        documentType: documentType,
        restaurantName: findRestaurant.name,
        expiryDate:
          findRestaurant.documents[documentType].expiryDate?.toDateString(),
      });

      await emailQueue.add('reminderExpiredDocument', {
        to: findRestaurantOwner.email,
        subject: `Reminder ${documentType} expiring soon`,
        html,
        template: `Reminder ${documentType} expiring soon`,
      });

      return {
        success: true,
        message: 'Reminder email has been sent',
      };
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

reminderExpiredDocumentWorker.on('completed', (job) => {
  console.log(`reminderExpiredDocument  job ${job.id} completed successfully!`);
});

reminderExpiredDocumentWorker.on('failed', (job, error) => {
  console.log(`reminderExpiredDocument job ${job?.id} failed:`, error);
});

reminderExpiredDocumentWorker.on('progress', (job, progress) => {
  console.log(`reminderExpiryDocument job ${job.id} progress:`, progress);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down reminder expired document worker...');
  await reminderExpiredDocumentWorker.close();
  await redisConnection.quit();
});

export { reminderExpiredDocumentWorker };

import { Job, Worker } from 'bullmq';
import { RoleEnums } from '../../interface/enums/enums';
import { IBaseUser } from '../../interface/models/models';
import { redisConnection } from '../../config/redisConfig';

import { Restaurant } from '../../models/restaurant';
import mongoose from 'mongoose';
import { AppError } from '../../utils/appError';
import { Driver } from '../../models/driver';
import { getConfig } from '../../config/config';

interface bannedUserJobData {
  userId: IBaseUser['_id'];
  userType: RoleEnums;
}

const config = getConfig();
const bannedUserWorker = new Worker(
  'bannedUserWorker',
  async (job: Job<bannedUserJobData>) => {
    const { userId, userType } = job.data;

    try {
      if (userType === RoleEnums.Restaurant_Owner) {
        const restaurant = await Restaurant.findOne({
          owner: new mongoose.Types.ObjectId(userId),
        });

        if (!restaurant) {
          throw new AppError('restaurant was not found', 404);
        }

        await Restaurant.updateOne(
          {
            _id: restaurant._id,
          },
          {
            $set: {
              banned: false,
            },
          }
        );
      } else if (userType === RoleEnums.Driver) {
        const driver = await Driver.findById(userId);

        if (!driver) {
          throw new AppError('driver was not found', 404);
        }

        await Driver.updateOne(
          {
            _id: driver._id,
          },
          {
            $set: {
              banned: false,
            },
          }
        );
      }
    } catch (error: any) {
      console.error('Failed to unbanned user', error);
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

bannedUserWorker.on('completed', (job) => {
  console.log(`bannedUser worker job ${job.id}`);
});

bannedUserWorker.on('failed', (job, error) => {
  console.error(`bannedUser worker job ${job?.id}`, error);
});

bannedUserWorker.on('progress', (job, progress) => {
  console.log(`bannedUser worker job ${job.id}`, progress);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down banneduser worker ');
  await bannedUserWorker.close();
  await redisConnection.quit();
});

export { bannedUserWorker };

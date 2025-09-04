import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redisConfig';
import config from '../../config/config';

export const retryFindDriverQueue = new Queue('retryFindDriver', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: config.bullmq.defaultJobOptions.removeOnComplete,
    removeOnFail: config.bullmq.defaultJobOptions.removeOnFail,
    attempts: config.bullmq.defaultJobOptions.attempts,
    backoff: {
      ...config.bullmq.defaultJobOptions.backoff,
    },
  },
});

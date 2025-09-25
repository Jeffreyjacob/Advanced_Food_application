import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redisConfig';
import { getConfig } from '../../config/config';

const config = getConfig();
export const BannedUser = new Queue('bannedUser', {
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

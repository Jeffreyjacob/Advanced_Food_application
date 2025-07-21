import { FlowProducer } from 'bullmq';
import { redisConnection } from '../config/redisConfig';

export const flowProducer = new FlowProducer({
  connection: redisConnection,
});

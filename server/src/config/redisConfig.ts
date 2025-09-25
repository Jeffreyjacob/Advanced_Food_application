import Redis from 'ioredis';
import { getConfig } from './config';

const config = getConfig();
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 1000,
  lazyConnect: true,
};

export const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => {
  console.log('Connected to Redis');
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error', err);
});

redisConnection.on('reconnecting', () => {
  console.log('Reconnecting to redis...');
});

export default redisConfig;

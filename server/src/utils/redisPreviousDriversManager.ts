import { redisConnection } from '../config/redisConfig';

export class RedisPreviousManager {
  private redis = redisConnection;
  private readonly keyPrefix = 'previous_drivers:';
  private readonly TTL = 24 * 60 * 60;

  private getKey(orderId: string): string {
    return `${this.keyPrefix}${orderId}`;
  }

  async addDriver(orderId: string, driverId: string): Promise<void> {
    const key = this.getKey(orderId);
    await this.redis.sadd(key, orderId);

    const ttl = await this.redis.ttl(key);
    if (ttl === -1) {
      await this.redis.expire(key, this.TTL);
    }
  }

  async getDrivers(orderId: string): Promise<string[]> {
    const key = this.getKey(orderId);
    return (await this.redis.smembers(key)) || [];
  }

  async deleteDriver(orderId: string): Promise<void> {
    const key = this.getKey(orderId);
    await this.redis.del(key);
  }
}

export const previousDriversManager = new RedisPreviousManager();

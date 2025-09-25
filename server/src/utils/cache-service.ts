import Redis, { Pipeline } from 'ioredis';
import { promisify } from 'util';
import * as zlib from 'zlib';
import { redisConnection } from '../config/redisConfig';
import { NextFunction, Request, Response } from 'express';

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

interface CacheConfig {
  maxDataSize?: {
    development: number;
    production: number;
  };

  compression?: {
    enabled: boolean;
    threshold: number;
  };

  timeouts?: {
    read: number;
    write: number;
  };

  batchSize?: number;
}

export class cacheService {
  private redis: Redis;
  private keyPrefix: string;

  private readonly config = {
    maxDataSize: {
      development: 5 * 1024 * 1024,
      production: 1 * 1024 * 1024,
    },
    compression: {
      enabled: true,
      threshold: 50 * 1024,
    },
    timeouts: {
      read: 3000,
      write: 5000,
    },
    batchSize: 100,
  };

  private isDevelopment: boolean;

  constructor(redisClient: Redis = redisConnection, config: CacheConfig = {}) {
    this.redis = redisClient;
    this.keyPrefix = 'api:';
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    Object.assign(this.config, config);
  }

  generateKey(
    prefix: string,
    identifier: string | number,
    params: Record<string, any> = {}
  ): string {
    let paramString = '';

    if (Object.keys(params).length > 0) {
      const sortedParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      if (sortedParams) {
        paramString = `${sortedParams}`;
      }
    }

    return `${this.keyPrefix}${prefix}:${identifier}${paramString}`;
  }

  // check data size limit before caching

  private checkDataSize(data: string): boolean {
    const maxSize = this.isDevelopment
      ? this.config.maxDataSize.development
      : this.config.maxDataSize.production;

    const dataSize = Buffer.byteLength(data, 'utf8');

    if (dataSize > maxSize) {
      console.log(
        `Date too large for cache: ${(dataSize / 1024 / 1024).toFixed}`
      );

      return false;
    }

    return true;
  }

  // compress data id above threshold

  private async processData(
    data: string
  ): Promise<{ data: string; isCompressed: boolean }> {
    const datasize = Buffer.byteLength(data, 'utf8');

    if (
      !this.config.compression.enabled ||
      datasize < this.config.compression.threshold
    ) {
      return { data, isCompressed: false };
    }

    try {
      const compressed = await gzipAsync(Buffer.from(data));

      if (compressed.length < datasize * 0.8) {
        return {
          data: compressed.toString('base64'),
          isCompressed: true,
        };
      }
    } catch (error) {
      console.error('compression failed', error);
    }

    return { data, isCompressed: false };
  }

  private async decompressData(
    data: string,
    isCompressed: boolean
  ): Promise<string> {
    if (!isCompressed) return data;

    try {
      const buffer = Buffer.from(data, 'base64');
      const decompressed = await gunzipAsync(buffer);
      return decompressed.toString();
    } catch (error) {
      throw new Error('Failed decompress cache data');
    }
  }

  // Execute with timeout

  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    operation: string
  ): Promise<T> {
    const timeouts = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operation} timeout after ${ms}ms`)),
        ms
      )
    );

    return Promise.race([promise, timeouts]);
  }

  // GEt with size and timeout protection

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const [value, meta] = await this.withTimeout(
        Promise.all([this.redis.get(key), this.redis.get(`${key}:gz`)]),
        this.config.timeouts.read,
        'GET'
      );

      if (!value) return null;

      const isCompressed = meta === '1';
      const decompressed = await this.decompressData(value, isCompressed);

      return JSON.parse(decompressed);
    } catch (error: any) {
      console.error(`Cache GET error for ${key}:`, error);
      return null;
    }
  }

  // SET with size check, compression and timeout

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (!this.checkDataSize(serialized)) {
        return false;
      }

      const { data, isCompressed } = await this.processData(serialized);

      // use pipeline for atomic operation

      const pipeline = this.redis.pipeline();
      pipeline.setex(key, ttl, data);

      if (isCompressed) {
        pipeline.setex(`${key}:gz`, ttl, '1');
      } else {
        pipeline.del(`${key}:gz`);
      }

      await this.withTimeout(
        pipeline.exec(),
        this.config.timeouts.write,
        'SET'
      );

      return true;
    } catch (error) {
      console.error(`Cahce SET error for ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const result = await this.withTimeout(
        this.redis.del(key, `${key}:gz`),
        this.config.timeouts.write,
        'DEL'
      );

      return result;
    } catch (error) {
      console.error(`Cache Del error for ${key}:`, error);
      return 0;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = pattern.startsWith(this.keyPrefix)
        ? pattern
        : `${this.keyPrefix}${pattern}`;

      let cursor = '0';
      let totalDeleted = 0;

      do {
        const [newCursor, keys] = await this.withTimeout(
          this.redis.scan(
            cursor,
            'MATCH',
            fullPattern,
            'COUNT',
            this.config.batchSize
          ),
          this.config.timeouts.read,
          'SCAN'
        );

        cursor = newCursor;

        if (keys.length > 0) {
          const allkeys = keys.reduce((acc: string[], key: string) => {
            acc.push(key, `${key}:gz`);
            return acc;
          }, []);

          const deleted = await this.withTimeout(
            this.redis.del(...allkeys),
            this.config.timeouts.write,
            'BATCH_DEL'
          );

          totalDeleted += Math.floor(deleted / 2);
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        console.log(`Deleted ${totalDeleted} keys matching: ${pattern}`);
      }

      return totalDeleted;
    } catch (error) {
      console.error(`Pattern deletion error for ${pattern}:`, error);
      return 0;
    }
  }

  // cache aside patter - most import method

  async cacheAside<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 3600
  ): Promise<CacheResult<T>> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return { data: cached, fromCache: true };
      }

      const data = await fetchFunction();
      await this.set(key, data, ttl);
      return { data, fromCache: false };
    } catch (error) {
      console.error('Cache-aside error', error);
      const data = await fetchFunction();
      return { data, fromCache: false };
    }
  }

  async writeThrough<T, R>(
    key: string,
    data: T,
    saveFunction: (data: T) => Promise<R>,
    ttl: number = 3600
  ): Promise<R> {
    const result = await saveFunction(data);

    setImmediate(async () => {
      try {
        await this.set(key, result, ttl);
      } catch (error) {
        console.error('Write through cache updated failed', error);
      }
    });

    return result;
  }

  async invalidate(patterns: string | string[]): Promise<number> {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];

    let totalDeleted = 0;

    for (const patter of patternArray) {
      totalDeleted += await this.delPattern(patter);
    }

    return totalDeleted;
  }

  //   async healthCheck():Promise<{status:"healthy" }>{

  //   }
}

export class CacheMiddleware {
  constructor(private cache: cacheService) {}

  response(ttl: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();

      const cacheKey = this.cache.generateKey('auto', req.path, req.query);
      const cache = this.cache;

      try {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          res.set('X-Cache', 'HIT');
          return res.json(cached);
        }

        const originalJson = res.json;

        res.json = function (data: any) {
          if (res.statusCode === 200) {
            setImmediate(() => cache.set(cacheKey, data, ttl));
          }
          res.set('X-Cache', 'MISS');
          return originalJson.call(res, data);
        };

        next();
      } catch (error: any) {}
    };
  }

  invalidate(patterns: string | string[]) {
    return async (req: any, res: any, next: any) => {
      const cache = this.cache;
      const originalJson = res.json.bind(res);

      res.json = (data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setImmediate(() => cache.invalidate(patterns)); // 👈 safe now
        }
        return originalJson(data);
      };

      next();
    };
  }
}

export default CacheMiddleware;

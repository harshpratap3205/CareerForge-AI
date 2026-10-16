import { Redis } from 'ioredis';
import { config } from './env.js';

let redisClient: Redis | null = null;

if (config.redisUrl) {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('Redis warning (continuing without cache):', err.message);
    });
  } catch (error) {
    console.warn('Redis initialization skipped:', error);
    redisClient = null;
  }
}

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Ignore cache write errors
  }
};

export const cacheDel = async (keyPatternOrKey: string): Promise<void> => {
  if (!redisClient) return;
  try {
    if (keyPatternOrKey.includes('*')) {
      const keys = await redisClient.keys(keyPatternOrKey);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } else {
      await redisClient.del(keyPatternOrKey);
    }
  } catch {
    // Ignore cache delete errors
  }
};

export { redisClient };

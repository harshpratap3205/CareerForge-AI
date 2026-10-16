import { Redis } from 'ioredis';
import { config } from './env.js';

let redisClient: Redis | null = null;

let formattedRedisUrl = config.redisUrl;
if (
  formattedRedisUrl &&
  formattedRedisUrl.includes('upstash.io') &&
  formattedRedisUrl.startsWith('redis://')
) {
  formattedRedisUrl = formattedRedisUrl.replace('redis://', 'rediss://');
}

if (formattedRedisUrl) {
  try {
    redisClient = new Redis(formattedRedisUrl, {
      connectTimeout: 10000,
      keepAlive: 15000,
      enableOfflineQueue: true,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.once('connect', () => {
      console.log('[Redis] Connected successfully to Redis server');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Client is ready for caching operations');
    });

    redisClient.on('error', (err) => {
      if (
        err.message?.includes('closed') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('max retries')
      ) {
        return;
      }
      console.warn('[Redis Warning]:', err.message);
    });
  } catch (error) {
    console.warn('[Redis] Initialization skipped:', error);
    redisClient = null;
  }
} else {
  console.log('[Redis] No REDIS_URL provided. Operating in direct database mode.');
}

const isRedisAvailable = (): boolean => {
  return (
    redisClient !== null &&
    (redisClient.status === 'ready' || redisClient.status === 'connect')
  );
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisAvailable() || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  if (!isRedisAvailable() || !redisClient) return;
  try {
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, 'EX', ttlSeconds);
  } catch {
    // Ignore cache set transient issues
  }
};

export const cacheDel = async (keyPatternOrKey: string): Promise<void> => {
  if (!isRedisAvailable() || !redisClient) return;
  try {
    if (keyPatternOrKey.includes('*')) {
      const keys = await redisClient.keys(keyPatternOrKey);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`[Redis] Cache invalidation: removed ${keys.length} keys`);
      }
    } else {
      await redisClient.del(keyPatternOrKey);
      console.log(`[Redis] Cache invalidation: key "${keyPatternOrKey}" removed`);
    }
  } catch {
    // Ignore cache del transient issues
  }
};

export { redisClient };

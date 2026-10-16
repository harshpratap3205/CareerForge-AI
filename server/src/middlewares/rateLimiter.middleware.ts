import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';

interface TokenBucketOptions {
  bucketPrefix: string;
  capacity: number;
  refillRate: number; // Tokens added per second
  message: string;
  keyGenerator?: (req: Request) => string;
}

const memoryBuckets = new Map<string, { tokens: number; lastRefill: number }>();

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
else
  local delta = math.max(0, (now - lastRefill) / 1000)
  tokens = math.min(capacity, tokens + delta * refillRate)
  lastRefill = now
end

if tokens >= requested then
  tokens = tokens - requested
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
  local ttl = math.max(60, math.ceil(capacity / refillRate) * 2)
  redis.call('EXPIRE', key, ttl)
  return { 1, math.floor(tokens), 0 }
else
  local needed = requested - tokens
  local waitTime = math.ceil(needed / refillRate)
  return { 0, math.floor(tokens), waitTime }
end
`;

export function createTokenBucketLimiter(options: TokenBucketOptions) {
  const { bucketPrefix, capacity, refillRate, message } = options;
  const getKey = options.keyGenerator || ((req: Request) => req.ip || 'unknown');

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = getKey(req);
    const key = `rate:bucket:${bucketPrefix}:${identifier}`;
    const now = Date.now();

    // Redis Token Bucket path
    if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connect')) {
      try {
        const result = (await redisClient.eval(
          TOKEN_BUCKET_LUA,
          1,
          key,
          capacity.toString(),
          refillRate.toString(),
          now.toString(),
          '1'
        )) as [number, number, number];

        const [allowed, remaining, waitTime] = result;

        res.setHeader('X-RateLimit-Limit', capacity);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));

        if (allowed === 1) {
          next();
          return;
        }

        res.setHeader('Retry-After', waitTime);
        res.status(429).json({
          success: false,
          message,
          retryAfter: waitTime,
        });
        return;
      } catch {
        // Fall back to memory bucket if Redis evaluation fails
      }
    }

    // In-memory Token Bucket fallback
    let bucket = memoryBuckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: now };
      memoryBuckets.set(key, bucket);
    } else {
      const delta = Math.max(0, (now - bucket.lastRefill) / 1000);
      bucket.tokens = Math.min(capacity, bucket.tokens + delta * refillRate);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
      next();
      return;
    }

    const waitTime = Math.ceil((1 - bucket.tokens) / refillRate);
    res.setHeader('Retry-After', waitTime);
    res.status(429).json({
      success: false,
      message,
      retryAfter: waitTime,
    });
  };
}

export const globalLimiter = createTokenBucketLimiter({
  bucketPrefix: 'global',
  capacity: 200,
  refillRate: 10,
  message: 'Too many requests. System rate limit reached, please try again shortly.',
});

export const aiLimiter = createTokenBucketLimiter({
  bucketPrefix: 'ai',
  capacity: 30,
  refillRate: 0.5,
  message: 'AI query limit reached. Please wait a few seconds before asking another question.',
  keyGenerator: (req: Request) => (req as any).user?.userId || req.ip || 'unknown',
});

export const authLimiter = createTokenBucketLimiter({
  bucketPrefix: 'auth',
  capacity: 25,
  refillRate: 0.1,
  message: 'Too many authentication attempts. Please wait before trying again.',
});

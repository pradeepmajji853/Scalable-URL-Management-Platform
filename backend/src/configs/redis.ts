import Redis from 'ioredis';
import config from './index';
import logger from './logger';

let redis: Redis;

function createRedisClient(): Redis {
  const client = new Redis(config.redis.url, {
    maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
    retryStrategy(times: number) {
      if (times > config.redis.maxRetries) {
        logger.error('Redis max retries exceeded, giving up');
        return null;
      }
      const delay = Math.min(times * config.redis.retryDelayMs, 10000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: false,
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (err: Error) => {
    logger.error('Redis client error', { error: err.message });
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
  });

  return client;
}

/**
 * Get or create the Redis client singleton
 */
export function getRedisClient(): Redis {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

/**
 * Check Redis connectivity
 */
export async function healthCheck(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const client = getRedisClient();
    await client.ping();
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', latencyMs: Date.now() - start };
  }
}

// ──── Cache Utility Methods ─────────────────────────────────────────────

/**
 * Get a cached value by key, automatically parsing JSON
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Cache get error', { key, error: (error as Error).message });
    return null;
  }
}

/**
 * Set a cached value with an optional TTL (in seconds)
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch (error) {
    logger.error('Cache set error', { key, error: (error as Error).message });
  }
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Cache del error', { key, error: (error as Error).message });
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    logger.error('Cache del pattern error', { pattern, error: (error as Error).message });
  }
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Cache exists error', { key, error: (error as Error).message });
    return false;
  }
}

/**
 * Gracefully shut down Redis
 */
export async function shutdown(): Promise<void> {
  if (redis) {
    logger.info('Shutting down Redis client...');
    await redis.quit();
    logger.info('Redis client shut down successfully');
  }
}

export default getRedisClient;

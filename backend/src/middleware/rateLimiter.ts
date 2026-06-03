import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../configs/redis';
import config from '../configs/index';
import { RateLimitError } from '../utils/errors';

/**
 * Create a Redis-backed rate limiter
 */
function createRateLimiter(windowMs: number, max: number, prefix: string = 'rl') {
  let store: any;

  try {
    const client = getRedisClient();
    store = new RedisStore({
      // Use sendCommand for ioredis compatibility
      sendCommand: (...args: string[]) => (client as any).call(...args),
      prefix: `${prefix}:`,
    });
  } catch (error) {
    // Fall back to memory store if Redis is unavailable
    store = undefined;
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
    },
    handler: (_req, _res, next) => {
      next(new RateLimitError('Too many requests, please try again later.'));
    },
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  });
}

/**
 * Default rate limiter for general API endpoints
 */
export const defaultRateLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max,
  'rl:default'
);

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter(
  config.rateLimit.authWindowMs,
  config.rateLimit.authMax,
  'rl:auth'
);

/**
 * API key rate limiter (more generous)
 */
export const apiKeyRateLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max * 5, // 5x the default for API key users
  'rl:apikey'
);

/**
 * Very strict rate limiter for sensitive operations (password reset, etc.)
 */
export const strictRateLimiter = createRateLimiter(
  config.rateLimit.authWindowMs,
  5, // Only 5 requests per window
  'rl:strict'
);

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/linkly',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetriesPerRequest: null as null,
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    refreshExpiryMs: parseInt(process.env.JWT_REFRESH_EXPIRY_MS || '604800000', 10), // 7 days
    issuer: process.env.JWT_ISSUER || 'linkly-api',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    name: process.env.APP_NAME || 'Linkly',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@linkly.app',
  },

  cache: {
    urlTtl: parseInt(process.env.CACHE_URL_TTL || '3600', 10), // 1 hour
    analyticsTtl: parseInt(process.env.CACHE_ANALYTICS_TTL || '300', 10), // 5 minutes
  },

  shortCode: {
    length: parseInt(process.env.SHORT_CODE_LENGTH || '7', 10),
    maxRetries: parseInt(process.env.SHORT_CODE_MAX_RETRIES || '5', 10),
  },

  cleanup: {
    cronExpression: process.env.CLEANUP_CRON || '0 2 * * *', // 2 AM daily
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.resolve(__dirname, '../../logs'),
  },
} as const;

export default config;

/**
 * Test Environment Setup
 *
 * This file runs before each test suite to configure environment variables
 * and mock external dependencies (database, redis).
 */

// =============================================================================
// Environment Variables
// =============================================================================
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DATABASE_URL = 'postgresql://testuser:testpassword@localhost:5432/linkly_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.APP_URL = 'http://localhost';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'noreply@test.com';
process.env.RATE_LIMIT_WINDOW = '15';
process.env.RATE_LIMIT_MAX = '1000';

// =============================================================================
// Mock Database Pool
// =============================================================================
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
    connect: jest.fn(),
  };

  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  };

  return {
    Pool: jest.fn(() => mockPool),
    Client: jest.fn(() => mockClient),
  };
});

// =============================================================================
// Mock Redis (IORedis)
// =============================================================================
jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn().mockReturnThis(),
    status: 'ready',
    pipeline: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
    }),
  }));
  return RedisMock;
});

// =============================================================================
// Mock BullMQ
// =============================================================================
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  QueueScheduler: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// =============================================================================
// Global Test Utilities
// =============================================================================

// Suppress console output during tests (uncomment to enable)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

export {};

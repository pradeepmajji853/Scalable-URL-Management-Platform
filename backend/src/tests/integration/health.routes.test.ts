/**
 * Integration Tests - Health Routes
 *
 * Tests for health check API endpoints:
 * - GET /api/v1/health
 * - GET /api/v1/health/detailed
 */

import express, { Request, Response } from 'express';
import request from 'supertest';

// =============================================================================
// Mock Dependencies
// =============================================================================

let mockDbHealthy = true;
let mockRedisHealthy = true;

const checkDbHealth = async (): Promise<{ status: string; latency: number }> => {
  if (!mockDbHealthy) {
    throw new Error('Database connection failed');
  }
  return { status: 'healthy', latency: 5 };
};

const checkRedisHealth = async (): Promise<{ status: string; latency: number }> => {
  if (!mockRedisHealthy) {
    throw new Error('Redis connection failed');
  }
  return { status: 'healthy', latency: 2 };
};

// =============================================================================
// Express App Setup
// =============================================================================

function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // ---- Basic Health Check ----
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // ---- Detailed Health Check ----
  app.get('/api/v1/health/detailed', async (_req: Request, res: Response) => {
    const healthChecks: Record<string, any> = {};
    let overallStatus = 'healthy';

    // Check database
    try {
      healthChecks.database = await checkDbHealth();
    } catch (error) {
      healthChecks.database = {
        status: 'unhealthy',
        error: (error as Error).message,
      };
      overallStatus = 'degraded';
    }

    // Check Redis
    try {
      healthChecks.redis = await checkRedisHealth();
    } catch (error) {
      healthChecks.redis = {
        status: 'unhealthy',
        error: (error as Error).message,
      };
      overallStatus = 'degraded';
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    healthChecks.memory = {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'test',
      checks: healthChecks,
    });
  });

  return app;
}

// =============================================================================
// Tests
// =============================================================================

describe('Health Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    mockDbHealthy = true;
    mockRedisHealthy = true;
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/health
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });

    it('should return a valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should return numeric uptime', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should respond with application/json content type', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/health/detailed
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/health/detailed', () => {
    it('should return 200 when all services are healthy', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.environment).toBe('test');
      expect(response.body.checks).toBeDefined();
    });

    it('should include database health check', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.checks.database).toBeDefined();
      expect(response.body.checks.database.status).toBe('healthy');
      expect(response.body.checks.database.latency).toBeDefined();
    });

    it('should include Redis health check', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.checks.redis).toBeDefined();
      expect(response.body.checks.redis.status).toBe('healthy');
      expect(response.body.checks.redis.latency).toBeDefined();
    });

    it('should include memory usage', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.checks.memory).toBeDefined();
      expect(response.body.checks.memory.heapUsed).toBeDefined();
      expect(response.body.checks.memory.heapTotal).toBeDefined();
      expect(response.body.checks.memory.rss).toBeDefined();
    });

    it('should return 503 when database is unhealthy', async () => {
      mockDbHealthy = false;

      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.database.status).toBe('unhealthy');
      expect(response.body.checks.database.error).toBe('Database connection failed');
    });

    it('should return 503 when Redis is unhealthy', async () => {
      mockRedisHealthy = false;

      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.redis.status).toBe('unhealthy');
      expect(response.body.checks.redis.error).toBe('Redis connection failed');
    });

    it('should return 503 when both services are unhealthy', async () => {
      mockDbHealthy = false;
      mockRedisHealthy = false;

      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.database.status).toBe('unhealthy');
      expect(response.body.checks.redis.status).toBe('unhealthy');
    });

    it('should still show healthy Redis when only database is down', async () => {
      mockDbHealthy = false;

      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(503);

      expect(response.body.checks.redis.status).toBe('healthy');
      expect(response.body.checks.database.status).toBe('unhealthy');
    });
  });
});

import { Router, Request, Response } from 'express';
import { healthCheck as dbHealthCheck } from '../../database/connection';
import { healthCheck as redisHealthCheck } from '../../configs/redis';
import { successResponse, errorResponse } from '../../utils/response';

const router = Router();

/**
 * Basic health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  successResponse(res, { status: 'OK', uptime: process.uptime() }, 'API is healthy');
});

/**
 * Detailed health check endpoint checking DB and Cache status
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const [dbStatus, redisStatus] = await Promise.all([
      dbHealthCheck(),
      redisHealthCheck(),
    ]);

    const isHealthy = dbStatus.status === 'healthy' && redisStatus.status === 'healthy';

    const data = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };

    if (isHealthy) {
      successResponse(res, data, 'All services are healthy');
    } else {
      res.status(503).json({
        success: false,
        message: 'One or more services are unhealthy',
        data,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    errorResponse(res, 'Health check failed', 500, (error as Error).message);
  }
});

export default router;

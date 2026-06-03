import app from './app';
import config from './configs/index';
import logger from './configs/logger';
import { pool, healthCheck as dbHealth } from './database/connection';
import { healthCheck as redisHealth, shutdown as closeRedis } from './configs/redis';
import { startClickWorker } from './jobs/clickProcessor';
import { startEmailWorker } from './jobs/emailProcessor';
import { startAnalyticsWorker } from './jobs/analyticsProcessor';
import { getAnalyticsQueue, closeQueues } from './queues';
import { Worker } from 'bullmq';
import http from 'http';

let server: http.Server;
let clickWorker: Worker;
let emailWorker: Worker;
let analyticsWorker: Worker;

async function startServer() {
  try {
    logger.info('Initializing services...');

    // 1. Verify Database Connection
    const dbStatus = await dbHealth();
    if (dbStatus.status !== 'healthy') {
      throw new Error(`Database connection failed: ${dbStatus.latencyMs}ms`);
    }
    logger.info('PostgreSQL connected and healthy');

    // 2. Verify Redis Connection
    const redisStatus = await redisHealth();
    if (redisStatus.status !== 'healthy') {
      throw new Error(`Redis connection failed: ${redisStatus.latencyMs}ms`);
    }
    logger.info('Redis connected and healthy');

    // 3. Start BullMQ Workers
    clickWorker = startClickWorker();
    emailWorker = startEmailWorker();
    analyticsWorker = startAnalyticsWorker();
    logger.info('BullMQ workers started successfully');

    // 4. Schedule background database cleanup (Cron)
    const analyticsQueue = getAnalyticsQueue();
    // Clear old repeatable jobs first to avoid duplicates
    const repeatableJobs = await analyticsQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await analyticsQueue.removeRepeatableByKey(job.key);
    }
    // Add repeatable job
    await analyticsQueue.add(
      'database-cleanup',
      { url_id: 'all', type: 'cleanup' },
      {
        repeat: {
          pattern: config.cleanup.cronExpression,
        },
      }
    );
    logger.info(`Scheduled background cleanup job (Cron: ${config.cleanup.cronExpression})`);

    // 5. Start HTTP Server
    server = app.listen(config.port, () => {
      logger.info(`Server is running in ${config.env} mode on port ${config.port}`);
      logger.info(`API Base URL: ${config.app.url}/api/v1`);
      logger.info(`Redirection Base URL: ${config.app.url}/r/`);
      logger.info(`Swagger Documentation: ${config.app.url}/api/docs`);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Set timeout to force shutdown if graceful takes too long
  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      logger.info('Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    // Close Workers
    logger.info('Closing background workers...');
    if (clickWorker) await clickWorker.close();
    if (emailWorker) await emailWorker.close();
    if (analyticsWorker) await analyticsWorker.close();
    logger.info('Background workers closed');

    // Close BullMQ Queues
    logger.info('Closing queues...');
    await closeQueues();
    logger.info('Queues closed');

    // Close Redis
    logger.info('Closing Redis connection...');
    await closeRedis();
    logger.info('Redis connection closed');

    // Close Database Pool
    logger.info('Closing PostgreSQL pool...');
    await pool.end();
    logger.info('PostgreSQL pool closed');

    clearTimeout(forceShutdownTimeout);
    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: (error as Error).message });
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

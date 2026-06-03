import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../queues';
import { AnalyticsJobData } from '../types';
import { runCleanup } from './cleanupJob';
import logger from '../configs/logger';

export function startAnalyticsWorker(): Worker {
  const worker = new Worker<AnalyticsJobData>(
    'analytics-queue',
    async (job: Job<AnalyticsJobData>) => {
      const { url_id, type } = job.data;
      logger.info(`[AnalyticsWorker] Processing analytics job for URL ID: ${url_id}, Type: ${type}`, {
        jobId: job.id,
      });

      try {
        if (type === 'aggregate') {
          // Future heavy aggregations
          logger.info(`[AnalyticsWorker] Compiled aggregate metrics for URL ID: ${url_id}`);
        } else if (type === 'cleanup') {
          logger.info(`[AnalyticsWorker] Executing scheduled maintenance cleanup task...`);
          await runCleanup();
        }
      } catch (error) {
        logger.error(`[AnalyticsWorker] Error processing job ${job.id}`, {
          error: (error as Error).message,
        });
        throw error;
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[AnalyticsWorker] Job ${job?.id} failed`, { error: err.message });
  });

  return worker;
}

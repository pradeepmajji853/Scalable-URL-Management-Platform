import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../queues';
import { clickRepository } from '../repositories/click.repository';
import { urlRepository } from '../repositories/url.repository';
import { ClickJobData } from '../types';
import { parseUserAgent, getGeoLocation } from '../utils/helpers';
import logger from '../configs/logger';

export function startClickWorker(): Worker {
  const worker = new Worker<ClickJobData>(
    'click-queue',
    async (job: Job<ClickJobData>) => {
      const { url_id, ip_address, user_agent, referrer, clicked_at } = job.data;
      logger.info(`[ClickWorker] Processing click for URL ID: ${url_id}`, { jobId: job.id });

      try {
        // Parse User-Agent and Geolocation
        const ua = parseUserAgent(user_agent);
        const geo = getGeoLocation(ip_address);

        // Save click details
        await clickRepository.create({
          url_id,
          ip_address,
          user_agent,
          referrer,
          browser: ua.browser,
          browser_version: ua.browserVersion,
          os: ua.os,
          os_version: ua.osVersion,
          device_type: ua.deviceType,
          country: geo.country || 'Unknown',
          city: geo.city || 'Unknown',
          region: geo.region || 'Unknown',
          latitude: geo.latitude || undefined,
          longitude: geo.longitude || undefined,
          clicked_at: new Date(clicked_at),
        });

        // Increment URL total clicks count
        await urlRepository.incrementClickCount(url_id);
        
        logger.info(`[ClickWorker] Successfully processed click for URL ID: ${url_id}`);
      } catch (error) {
        logger.error(`[ClickWorker] Error processing click for URL ID: ${url_id}`, {
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
        throw error; // Let BullMQ handle retries
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 10,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[ClickWorker] Job ${job?.id} failed`, { error: err.message });
  });

  return worker;
}

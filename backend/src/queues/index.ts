import { Queue, ConnectionOptions } from 'bullmq';
import config from '../configs/index';
import { ClickJobData, EmailJobData, AnalyticsJobData } from '../types';

let connectionOptions: ConnectionOptions | null = null;

export function getQueueConnection(): ConnectionOptions {
  if (!connectionOptions) {
    try {
      const url = new URL(config.redis.url);
      connectionOptions = {
        host: url.hostname || 'localhost',
        port: url.port ? parseInt(url.port, 10) : 6379,
        username: url.username || undefined,
        password: url.password || undefined,
        maxRetriesPerRequest: null, // Critical for BullMQ
      };
    } catch (e) {
      // Fallback
      connectionOptions = {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
      };
    }
  }
  return connectionOptions;
}

let clickQueue: Queue<ClickJobData> | null = null;
let emailQueue: Queue<EmailJobData> | null = null;
let analyticsQueue: Queue<AnalyticsJobData> | null = null;

export function getClickQueue(): Queue<ClickJobData> {
  if (!clickQueue) {
    clickQueue = new Queue<ClickJobData>('click-queue', {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return clickQueue;
}

export function getEmailQueue(): Queue<EmailJobData> {
  if (!emailQueue) {
    emailQueue = new Queue<EmailJobData>('email-queue', {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return emailQueue;
}

export function getAnalyticsQueue(): Queue<AnalyticsJobData> {
  if (!analyticsQueue) {
    analyticsQueue = new Queue<AnalyticsJobData>('analytics-queue', {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return analyticsQueue;
}

export async function closeQueues(): Promise<void> {
  if (clickQueue) {
    await clickQueue.close();
    clickQueue = null;
  }
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
  if (analyticsQueue) {
    await analyticsQueue.close();
    analyticsQueue = null;
  }
}

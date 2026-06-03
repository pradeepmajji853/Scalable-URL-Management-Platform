import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../configs/logger';
import { AuthRequest } from '../types';

/**
 * Request/response logging middleware
 */
export function requestLogger(req: AuthRequest, res: Response, next: NextFunction): void {
  // Generate unique request ID
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = requestId;

  // Set request ID in response headers
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Log incoming request
  logger.info(`→ ${method} ${originalUrl}`, {
    requestId,
    ip,
    userAgent: req.headers['user-agent']?.substring(0, 100),
  });

  // Capture response finish
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`← ${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      requestId,
      statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length'),
    });

    return originalEnd.apply(this, args as any);
  };

  next();
}

export default requestLogger;

import winston from 'winston';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || path.resolve(__dirname, '../../logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}] ` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${reqId}${message}${metaStr}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}] ` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${reqId}${message}${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: NODE_ENV === 'development' ? 'debug' : LOG_LEVEL,
  }),
];

if (NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: customFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'linkly-api' },
  transports,
  exitOnError: false,
});

/**
 * Create a child logger with a request ID attached
 */
export function createRequestLogger(requestId: string): winston.Logger {
  return logger.child({ requestId });
}

export default logger;

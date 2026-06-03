import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../configs/logger';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle custom ValidationError with field errors
  if (err instanceof ValidationError && err.errors) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.code,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.code,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
      error: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle PostgreSQL unique violation
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'CONFLICT',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle PostgreSQL foreign key violation
  if ((err as any).code === '23503') {
    res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
      error: 'FOREIGN_KEY_VIOLATION',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default 500 error
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    error: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

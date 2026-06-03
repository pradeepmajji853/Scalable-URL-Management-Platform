import { Response } from 'express';
import { APIResponse, PaginatedResponse, PaginationOptions } from '../types';

/**
 * Send a standardized success response
 */
export function successResponse<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response {
  const response: APIResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 */
export function errorResponse(
  res: Response,
  message: string = 'Internal Server Error',
  statusCode: number = 500,
  error?: string
): Response {
  const response: APIResponse = {
    success: false,
    message,
    error: error || message,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a standardized paginated response
 */
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  pagination: PaginationOptions,
  message: string = 'Success'
): Response {
  const totalPages = Math.ceil(total / pagination.limit);
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(200).json(response);
}

/**
 * Send a no-content response (for deletes etc.)
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

/**
 * Send a created response
 */
export function createdResponse<T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): Response {
  return successResponse(res, data, message, 201);
}

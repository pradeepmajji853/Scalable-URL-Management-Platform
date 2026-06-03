import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware factory
 * Validates the specified request target (body, query, or params) against a Zod schema
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Replace the request target with the parsed (and potentially transformed) data
      (req as any)[target] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}

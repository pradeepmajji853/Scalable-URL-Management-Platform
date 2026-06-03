import { Response, NextFunction } from 'express';
import { AuthRequest, AuthenticatedUser } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { verifyToken } from '../utils/helpers';
import logger from '../configs/logger';

/**
 * JWT authentication middleware - requires valid token
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please provide a valid token.');
    }

    const payload = verifyToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthenticatedUser;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token has expired. Please login again.'));
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token. Please login again.'));
      return;
    }
    logger.error('Authentication error', { error: err.message });
    next(new UnauthorizedError('Authentication failed.'));
  }
}

/**
 * Optional authentication - attaches user if token is present, but doesn't require it
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthenticatedUser;

    next();
  } catch (error) {
    // Token is invalid but since auth is optional, just continue
    next();
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new UnauthorizedError('Insufficient permissions.'));
      return;
    }

    next();
  };
}

/**
 * Extract JWT from Authorization header or cookies
 */
function extractToken(req: AuthRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  return null;
}

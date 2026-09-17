import type { Request, Response, NextFunction } from 'express';
import type { ServiceRegistry } from '../../../core/registry/service-registry-builder.js';
import type { AuthTokenPort } from '../../../domain/ports/infrastructure.port.js';
import { UnauthorizedError } from '../../../shared/errors/domain-errors.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  userRole: string;
}

export function createAuthMiddleware(auth: AuthTokenPort) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new UnauthorizedError('Missing authentication token'));
      return;
    }
    try {
      const payload = auth.verify(header.slice(7));
      (req as AuthenticatedRequest).userId = payload.userId;
      (req as AuthenticatedRequest).userEmail = payload.email;
      (req as AuthenticatedRequest).userRole = payload.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function attachRegistry(registry: ServiceRegistry) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as Request & { registry: ServiceRegistry }).registry = registry;
    next();
  };
}

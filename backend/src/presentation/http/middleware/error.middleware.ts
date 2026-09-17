import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../shared/errors/domain-errors.js';
import { errorResponse } from '../../../shared/types/api-response.js';

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json(errorResponse(err));
    return;
  }
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

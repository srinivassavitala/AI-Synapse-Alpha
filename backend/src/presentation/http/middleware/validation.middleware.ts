import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/errors/domain-errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError(result.error.errors.map((e) => e.message).join(', ')));
      return;
    }
    req.body = result.data;
    next();
  };
}

export const authSchemas = {
  login: z.object({ email: z.string().email(), password: z.string().min(6) }),
  register: z.object({ email: z.string().email(), password: z.string().min(6), fullName: z.string().min(2) }),
};

export const workspaceSchemas = {
  create: z.object({ name: z.string().min(2).max(100) }),
  invite: z.object({ email: z.string().email(), role: z.enum(['admin', 'member', 'viewer']) }),
};

export const conversationSchemas = {
  create: z.object({ title: z.string().min(1).max(200).optional() }),
  message: z.object({ content: z.string().min(1).max(10000) }),
};

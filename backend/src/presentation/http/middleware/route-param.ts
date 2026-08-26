import type { Request } from 'express';

export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function routeParamFrom(req: Request, key: string): string {
  return routeParam(req.params[key]);
}

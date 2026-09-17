import type { DomainError } from '../errors/domain-errors.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: Record<string, unknown>;
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { success: true, data, meta };
}

export function errorResponse(error: DomainError): ApiResponse {
  return {
    success: false,
    error: { code: error.code, message: error.message },
  };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  return {
    success: true,
    data: items,
    meta: {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

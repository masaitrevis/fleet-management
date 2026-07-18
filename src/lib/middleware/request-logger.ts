/**
 * Next.js middleware for logging all incoming requests.
 * Logs method, path, status, duration, userAgent, ip, tenantId.
 * Skips health check endpoints to reduce noise.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

const HEALTH_CHECK_PATHS = [
  '/api/health',
  '/api/ready',
  '/api/live',
  '/api/metrics',
];

function isHealthCheck(path: string): boolean {
  return HEALTH_CHECK_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function requestLoggerMiddleware(request: NextRequest) {
  const start = Date.now();
  const path = request.nextUrl.pathname;

  // Skip noisy health checks
  if (isHealthCheck(path)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const duration = Date.now() - start;

  const status = 200; // We can't know the final status in middleware for app router easily,
  // so we log what we have. For accurate status logging, wrap route handlers.

  const logData = {
    method: request.method,
    path,
    status,
    duration,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    tenantId: request.headers.get('x-tenant-id') || undefined,
  };

  logger.info('Request', logData);

  return response;
}

/**
 * Helper to log a completed request with the actual response status.
 * Use this inside route handlers for accurate status logging.
 */
export function logRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
  request: { headers: Headers }
): void {
  if (isHealthCheck(path)) return;

  const logData = {
    method,
    path,
    status,
    duration,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    tenantId: request.headers.get('x-tenant-id') || undefined,
  };

  if (status >= 500) {
    logger.error('Request failed', logData);
  } else if (status >= 400) {
    logger.warn('Request warning', logData);
  } else {
    logger.info('Request completed', logData);
  }
}

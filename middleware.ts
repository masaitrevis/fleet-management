import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRegistry } from '@/lib/metrics/registry';
import { getLogger } from '@/lib/logger';

const logger = getLogger();
const registry = getRegistry();

const HEALTH_CHECK_PATHS = [
  '/api/health',
  '/api/ready',
  '/api/live',
  '/api/metrics',
];

function isHealthCheck(path: string): boolean {
  return HEALTH_CHECK_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const start = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  const response = NextResponse.next();

  if (!isHealthCheck(path)) {
    const duration = Date.now() - start;
    const durationSeconds = duration / 1000;

    // Metrics
    registry.counter('http_requests_total', 'Total HTTP requests', {
      method,
      path,
      status: '200',
    });
    registry.histogram(
      'http_request_duration_seconds',
      'HTTP request duration in seconds',
      durationSeconds,
      { method, path }
    );

    // Logging
    logger.info('Request started', {
      method,
      path,
      duration,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      tenantId: request.headers.get('x-tenant-id') || undefined,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};

/**
 * Next.js middleware for collecting HTTP metrics.
 * Tracks request count, duration, and response status.
 * Stores in the simple in-memory Prometheus registry.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRegistry } from '@/lib/metrics/registry';

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

export async function metricsMiddleware(request: NextRequest) {
  const start = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  const response = NextResponse.next();
  const duration = Date.now() - start;

  // Only track non-health-check paths
  if (!isHealthCheck(path)) {
    // Count request
    registry.counter('http_requests_total', 'Total HTTP requests', {
      method,
      path,
      status: '200',
    });

    // Duration histogram (in seconds, as Prometheus convention)
    const durationSeconds = duration / 1000;
    registry.histogram(
      'http_request_duration_seconds',
      'HTTP request duration in seconds',
      durationSeconds,
      { method, path }
    );
  }

  return response;
}

/**
 * Record the actual response status for a completed request.
 * Call this from inside route handlers for accurate status tracking.
 */
export function recordHttpMetrics(
  method: string,
  path: string,
  status: number,
  durationMs: number
): void {
  if (isHealthCheck(path)) return;

  const registry = getRegistry();
  const statusStr = String(status);

  registry.counter('http_requests_total', 'Total HTTP requests', {
    method,
    path,
    status: statusStr,
  });

  const durationSeconds = durationMs / 1000;
  registry.histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    durationSeconds,
    { method, path }
  );
}

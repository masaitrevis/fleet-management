import { NextResponse } from 'next/server';
import { getRegistry } from '@/lib/metrics/registry';

/**
 * Prometheus metrics endpoint.
 * Returns text in Prometheus exposition format.
 */
export async function GET() {
  const registry = getRegistry();

  // Push current process metrics as gauges
  const mem = process.memoryUsage();
  registry.gauge(
    'process_memory_usage_bytes',
    'Current process memory usage in bytes',
    mem.rss,
    { type: 'rss' }
  );
  registry.gauge(
    'process_memory_heap_used_bytes',
    'Heap memory used in bytes',
    mem.heapUsed,
    { type: 'heap_used' }
  );
  registry.gauge(
    'process_memory_heap_total_bytes',
    'Total heap memory in bytes',
    mem.heapTotal,
    { type: 'heap_total' }
  );

  // Uptime
  registry.gauge(
    'process_uptime_seconds',
    'Process uptime in seconds',
    process.uptime(),
    {}
  );

  const body = registry.format();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { logRequest } from '@/lib/middleware/request-logger';
import { recordHttpMetrics } from '@/lib/middleware/metrics';

const logger = getLogger();

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    { success: false, error: { code: 'HEALTH_CHECK_ERROR', message } },
    { status }
  );
}

async function checkDatabase(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', responseTime: Date.now() - start };
  } catch {
    return { status: 'unhealthy', responseTime: Date.now() - start };
  }
}

function checkMemory(): { status: string; usage: number } {
  const usage = process.memoryUsage();
  const total = usage.heapTotal + usage.rss;
  const used = usage.heapUsed + usage.rss;
  const percentage = Math.round((used / total) * 100);
  return {
    status: percentage > 90 ? 'unhealthy' : percentage > 75 ? 'warning' : 'healthy',
    usage: percentage,
  };
}

function checkDisk(): { status: string; usage: number } {
  try {
    const fs = require('fs');
    const stats = fs.statfsSync(process.cwd());
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    const used = total - free;
    const percentage = Math.round((used / total) * 100);
    return {
      status: percentage > 90 ? 'unhealthy' : percentage > 80 ? 'warning' : 'healthy',
      usage: percentage,
    };
  } catch {
    return { status: 'unknown', usage: 0 };
  }
}

export async function GET(request: Request) {
  const start = Date.now();
  try {
    const [database, memory, disk] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDisk()),
    ]);

    const overallStatus =
      database.status === 'unhealthy' || memory.status === 'unhealthy' || disk.status === 'unhealthy'
        ? 'unhealthy'
        : database.status === 'warning' || memory.status === 'warning' || disk.status === 'warning'
          ? 'degraded'
          : 'healthy';

    const duration = Date.now() - start;
    const url = new URL(request.url);
    logRequest('GET', url.pathname, 200, duration, request);
    recordHttpMetrics('GET', url.pathname, 200, duration);

    return successResponse({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      checks: {
        database,
        memory,
        disk,
      },
    });
  } catch (error) {
    const duration = Date.now() - start;
    const url = new URL(request.url);
    logRequest('GET', url.pathname, 500, duration, request);
    recordHttpMetrics('GET', url.pathname, 500, duration);
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    return errorResponse(error instanceof Error ? error.message : 'Health check failed');
  }
}

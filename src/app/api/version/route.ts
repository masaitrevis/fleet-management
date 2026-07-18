import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getLogger } from '@/lib/logger';
import { logRequest } from '@/lib/middleware/request-logger';
import { recordHttpMetrics } from '@/lib/middleware/metrics';

const logger = getLogger();

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function getPackageInfo() {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return {
      version: pkg.version || '0.1.0',
      name: pkg.name || 'fleet-management-saas',
    };
  } catch {
    return { version: '0.1.0', name: 'fleet-management-saas' };
  }
}

export async function GET(request: Request) {
  const start = Date.now();
  const pkg = getPackageInfo();
  const duration = Date.now() - start;
  const url = new URL(request.url);

  logRequest('GET', url.pathname, 200, duration, request);
  recordHttpMetrics('GET', url.pathname, 200, duration);
  logger.info('Version request', { version: pkg.version, node: process.version });

  return successResponse({
    ...pkg,
    nodeVersion: process.version,
    buildTime: process.env.BUILD_TIME || null,
    gitCommit: process.env.GIT_COMMIT || null,
    environment: process.env.NODE_ENV || 'development',
    platform: process.platform,
  });
}

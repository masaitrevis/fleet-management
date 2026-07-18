import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { AppError, ForbiddenError } from '@/shared/errors/AppError';
import {
  MonitoringProvider,
  MockMonitoringProvider,
} from '@/modules/platform-admin/providers/monitoring.provider';
import { getLogger } from '@/lib/logger';
import { logRequest } from '@/lib/middleware/request-logger';
import { recordHttpMetrics } from '@/lib/middleware/metrics';

const logger = getLogger();

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 }
  );
}

const provider: MonitoringProvider = new MockMonitoringProvider();

function requireAdmin(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const rolesHeader = req.headers.get('x-user-roles');
      const roles = rolesHeader ? JSON.parse(rolesHeader) : [];
      const isAdmin =
        roles.includes('admin') ||
        roles.includes('platform_admin') ||
        roles.includes('super_admin');

      if (!isAdmin) {
        throw new ForbiddenError('Admin access required');
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }
  };
}

export const GET = withAuth(
  requireAdmin(async (request: NextRequest) => {
    const start = Date.now();
    try {
      const [
        cpuUsage,
        memoryUsage,
        diskUsage,
        networkStats,
        dbConnections,
        apiResponseTimes,
      ] = await Promise.all([
        provider.getCPUUsage(),
        provider.getMemoryUsage(),
        provider.getDiskUsage(),
        provider.getNetworkStats(),
        provider.getDBConnections(),
        provider.getAPIResponseTimes(),
      ]);

      const duration = Date.now() - start;
      const url = new URL(request.url);
      logRequest('GET', url.pathname, 200, duration, request);
      recordHttpMetrics('GET', url.pathname, 200, duration);
      logger.info('Performance diagnostics accessed', { path: url.pathname });

      return successResponse({
        timestamp: new Date().toISOString(),
        system: {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
          network: networkStats,
        },
        database: dbConnections,
        api: apiResponseTimes,
      });
    } catch (error) {
      const duration = Date.now() - start;
      const url = new URL(request.url);
      logRequest('GET', url.pathname, 500, duration, request);
      recordHttpMetrics('GET', url.pathname, 500, duration);
      logger.error('Performance diagnostics failed', { error: error instanceof Error ? error.message : String(error) });
      return errorResponse(error as Error);
    }
  })
);

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/modules/auth/utils/jwt';
import { AppError, UnauthorizedError, ForbiddenError } from '@/shared/errors/AppError';
import { prisma } from '@/lib/prisma';

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;

export async function adminAuthMiddleware(req: NextRequest) {
  try {
    // Check for special admin token first (for service-to-service or emergency access)
    const adminToken = req.headers.get('x-admin-token');
    if (adminToken && adminToken === ADMIN_TOKEN) {
      return { user: { sub: 'admin', role: 'SUPER_ADMIN', isAdminToken: true }, headers: req.headers };
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Check if user is a platform admin
    const platformUser = await prisma.platformUser.findUnique({
      where: { id: payload.sub },
    });

    if (!platformUser || platformUser.status !== 'ACTIVE') {
      throw new ForbiddenError('Platform admin access required');
    }

    if (platformUser.lockedUntil && platformUser.lockedUntil > new Date()) {
      throw new ForbiddenError('Account is temporarily locked');
    }

    const headers = new Headers(req.headers);
    headers.set('x-admin-id', platformUser.id);
    headers.set('x-admin-role', platformUser.role);

    return { user: { ...payload, role: platformUser.role, isPlatformAdmin: true }, headers };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function withAdminAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const { headers } = await adminAuthMiddleware(req);
      const modifiedReq = new NextRequest(req.url, {
        method: req.method,
        headers,
        body: req.body,
      });
      return handler(modifiedReq, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }
  };
}

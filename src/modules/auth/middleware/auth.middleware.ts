import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../utils/jwt';
import { AppError, UnauthorizedError } from '@/shared/errors/AppError';

export async function authMiddleware(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Attach user context to request
    const request = req as NextRequest & { user?: typeof payload };
    request.user = payload;

    // Set headers for downstream handlers
    const headers = new Headers(req.headers);
    headers.set('x-user-id', payload.sub);
    headers.set('x-company-id', payload.cid);

    return { user: payload, headers };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function withAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const { headers } = await authMiddleware(req);
      // Create new request with modified headers
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

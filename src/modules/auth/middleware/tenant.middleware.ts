import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/shared/errors/AppError';

export function tenantMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const companyId = req.headers.get('x-company-id');
      if (!companyId) {
        throw new AppError('Company context required', 400, 'MISSING_TENANT');
      }

      // Validate company ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(companyId)) {
        throw new AppError('Invalid company ID', 400, 'INVALID_TENANT');
      }

      return handler(req);
    } catch (error) {
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
  };
}

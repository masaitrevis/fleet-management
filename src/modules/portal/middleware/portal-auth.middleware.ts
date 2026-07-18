import { NextRequest, NextResponse } from 'next/server';
import { CustomerAuthService } from '@/modules/portal/services/customer-auth.service';

/**
 * Customer Auth Middleware
 * Validates customer JWT tokens for portal routes
 */
export function withCustomerAuth(
  handler: (req: NextRequest, customerId: string, companyId: string, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Access token required' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const service = new CustomerAuthService();
      const payload = service.verifyToken(token);

      if (payload.type !== 'customer') {
        return NextResponse.json({ success: false, error: 'Invalid token type' }, { status: 403 });
      }

      return handler(req, payload.sub, payload.cid, context);
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  };
}

/**
 * Driver Mobile Auth Middleware
 * Validates driver JWT tokens for mobile routes
 * Expects x-driver-id and x-company-id headers (set by main auth middleware)
 */
export async function withDriverAuth(
  handler: (req: NextRequest, driverId: string, companyId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const driverId = req.headers.get('x-driver-id');
      const companyId = req.headers.get('x-company-id');

      if (!driverId || !companyId) {
        return NextResponse.json({ success: false, error: 'Driver authentication required' }, { status: 401 });
      }

      return handler(req, driverId, companyId);
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  };
}

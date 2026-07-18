import { NextRequest } from 'next/server';
import { CouponController } from '@/modules/billing/controllers/usage-feature-coupon.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  return CouponController.getAll(req);
});

export const POST = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return CouponController.create(req, companyId);
});

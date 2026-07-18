import { NextRequest } from 'next/server';
import { UsageController } from '@/modules/billing/controllers/usage-feature-coupon.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return UsageController.getAll(req, companyId);
});

export const POST = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return UsageController.syncLimits(req, companyId);
});

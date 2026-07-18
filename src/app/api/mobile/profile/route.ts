import { NextRequest } from 'next/server';
import { MobileDriverController } from '@/modules/portal/controllers/mobile-driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const driverId = req.headers.get('x-user-id')!;
  const companyId = req.headers.get('x-company-id')!;
  return MobileDriverController.getProfile(req, driverId, companyId);
});

export const PATCH = withAuth(async (req: NextRequest) => {
  const driverId = req.headers.get('x-user-id')!;
  const companyId = req.headers.get('x-company-id')!;
  return MobileDriverController.updateProfile(req, driverId, companyId);
});

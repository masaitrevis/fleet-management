import { NextRequest } from 'next/server';
import { MobileDriverController } from '@/modules/portal/controllers/mobile-driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const driverId = req.headers.get('x-user-id')!;
  const companyId = req.headers.get('x-company-id')!;
  return MobileDriverController.getTrip(req, driverId, companyId, params.id);
});

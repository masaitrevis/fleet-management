import { NextRequest } from 'next/server';
import { trackingController } from '@/modules/tracking/controllers/tracking.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('tracking:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => trackingController.getVehicleLiveLocation(req, { params })
  )
);

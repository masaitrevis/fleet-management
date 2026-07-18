import { NextRequest } from 'next/server';
import { gpsDeviceController } from '@/modules/gps/controllers/gps-device.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('gps:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => gpsDeviceController.deactivate(req, { params })
  )
);

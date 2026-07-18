import { NextRequest } from 'next/server';
import { gpsDeviceController } from '@/modules/gps/controllers/gps-device.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('gps:read')(
    async (req: NextRequest) => gpsDeviceController.getFilters(req)
  )
);

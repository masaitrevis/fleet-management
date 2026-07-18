import { NextRequest } from 'next/server';
import { geofenceController } from '@/modules/geofence/controllers/geofence.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('geofence:read')(
    async (req: NextRequest) => geofenceController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('geofence:create')(
    async (req: NextRequest) => geofenceController.create(req)
  )
);

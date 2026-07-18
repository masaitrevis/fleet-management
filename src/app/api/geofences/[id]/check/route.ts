import { NextRequest } from 'next/server';
import { geofenceController } from '@/modules/geofence/controllers/geofence.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('geofence:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => geofenceController.checkPoint(req, { params })
  )
);

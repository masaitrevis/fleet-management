import { NextRequest } from 'next/server';
import { geofenceController } from '@/modules/geofence/controllers/geofence.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('geofence:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => geofenceController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('geofence:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => geofenceController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('geofence:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => geofenceController.delete(req, { params })
  )
);

import { NextRequest } from 'next/server';
import { gpsDeviceController } from '@/modules/gps/controllers/gps-device.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('gps:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => gpsDeviceController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('gps:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => gpsDeviceController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('gps:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => gpsDeviceController.delete(req, { params })
  )
);

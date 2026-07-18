import { NextRequest } from 'next/server';
import { vehicleController } from '@/modules/vehicle/controllers/vehicle.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('vehicles:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => vehicleController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('vehicles:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => vehicleController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('vehicles:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => vehicleController.delete(req, { params })
  )
);

import { NextRequest } from 'next/server';
import { vehicleController } from '@/modules/vehicle/controllers/vehicle.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('vehicles:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => vehicleController.assign(req, { params })
  )
);

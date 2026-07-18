import { NextRequest } from 'next/server';
import { vehicleController } from '@/modules/vehicle/controllers/vehicle.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('vehicles:read')(
    async (req: NextRequest) => vehicleController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('vehicles:create')(
    async (req: NextRequest) => vehicleController.create(req)
  )
);

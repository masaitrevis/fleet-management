import { NextRequest } from 'next/server';
import { vehicleCategoryController } from '@/modules/vehicle/controllers/vehicle.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('vehicles:read')(
    async (req: NextRequest) => vehicleCategoryController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('vehicles:update')(
    async (req: NextRequest) => vehicleCategoryController.create(req)
  )
);

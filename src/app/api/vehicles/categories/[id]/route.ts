import { NextRequest } from 'next/server';
import { vehicleCategoryController } from '@/modules/vehicle/controllers/vehicle.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const DELETE = withAuth(
  requirePermission('vehicles:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => vehicleCategoryController.delete(req, { params })
  )
);

import { NextRequest } from 'next/server';
import { fuelSupplierController } from '@/modules/fuel-supplier/controllers/fuel-supplier.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest) => fuelSupplierController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('fuel:manage')(
    async (req: NextRequest) => fuelSupplierController.create(req)
  )
);

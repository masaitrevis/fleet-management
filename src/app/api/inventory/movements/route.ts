import { NextRequest } from 'next/server';
import { stockMovementController } from '@/modules/stock-movement/controllers/stock-movement.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return stockMovementController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('inventory:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return stockMovementController.create(req, companyId);
    }
  )
);

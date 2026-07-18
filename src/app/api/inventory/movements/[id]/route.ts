import { NextRequest } from 'next/server';
import { stockMovementController } from '@/modules/stock-movement/controllers/stock-movement.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return stockMovementController.getById(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('inventory:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return stockMovementController.delete(req, companyId, id);
    }
  )
);

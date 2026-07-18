import { NextRequest } from 'next/server';
import { purchaseOrderController } from '@/modules/purchase-order/controllers/purchase-order.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return purchaseOrderController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('inventory:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return purchaseOrderController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('inventory:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return purchaseOrderController.delete(req, companyId, id);
    }
  )
);

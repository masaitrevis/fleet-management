import { NextRequest } from 'next/server';
import { inventoryAlertController } from '@/modules/inventory-alert/controllers/inventory-alert.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inventoryAlertController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('inventory:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      const body = await req.json();
      if (body.action === 'resolve') {
        return inventoryAlertController.resolve(req, companyId, id);
      }
      return inventoryAlertController.markAsRead(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('inventory:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inventoryAlertController.delete(req, companyId, id);
    }
  )
);

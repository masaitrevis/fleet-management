import { NextRequest } from 'next/server';
import { warehouseTransferController } from '@/modules/warehouse-transfer/controllers/warehouse-transfer.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return warehouseTransferController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('inventory:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return warehouseTransferController.create(req, companyId);
    }
  )
);

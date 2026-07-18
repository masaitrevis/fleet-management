import { NextRequest } from 'next/server';
import { workOrderController } from '@/modules/work-order/controllers/work-order.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('maintenance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return workOrderController.approve(req, { params: { id } });
    }
  )
);

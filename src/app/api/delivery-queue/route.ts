import { NextRequest } from 'next/server';
import { deliveryQueueController } from '@/modules/delivery-queue/controllers/delivery-queue.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return deliveryQueueController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return deliveryQueueController.create(req, companyId);
    }
  )
);
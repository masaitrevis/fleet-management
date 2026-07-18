import { NextRequest } from 'next/server';
import { inventoryAnalyticsController } from '@/modules/inventory-analytics/controllers/inventory-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inventoryAnalyticsController.topMoving(req, companyId);
    }
  )
);
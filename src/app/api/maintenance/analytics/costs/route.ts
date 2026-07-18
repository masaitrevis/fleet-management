import { NextRequest } from 'next/server';
import { maintenanceAnalyticsController } from '@/modules/maintenance-analytics/controllers/maintenance-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => maintenanceAnalyticsController.getCosts(req)
  )
);

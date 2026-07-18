import { NextRequest } from 'next/server';
import { fuelAnalyticsController } from '@/modules/fuel-analytics/controllers/fuel-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest) => fuelAnalyticsController.getOverview(req)
  )
);

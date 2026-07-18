import { NextRequest } from 'next/server';
import { complianceAnalyticsController } from '@/modules/compliance-analytics/controllers/compliance-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('compliance:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return complianceAnalyticsController.score(req, companyId);
    }
  )
);
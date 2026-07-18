import { NextRequest } from 'next/server';
import { AnalyticsController } from '@/modules/analytics/controllers/analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return AnalyticsController.getDriverKPIs(req, companyId);
});

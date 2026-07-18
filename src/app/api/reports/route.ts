import { NextRequest } from 'next/server';
import { ReportController } from '@/modules/analytics/controllers/report.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return ReportController.list(req, companyId);
});

export const POST = withAuth(async (req: NextRequest) => {
  const companyId = req.headers.get('x-company-id')!;
  return ReportController.generate(req, companyId);
});

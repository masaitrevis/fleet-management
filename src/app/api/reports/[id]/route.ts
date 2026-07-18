import { NextRequest } from 'next/server';
import { ReportController } from '@/modules/analytics/controllers/report.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';

export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const companyId = req.headers.get('x-company-id')!;
  return ReportController.getById(req, companyId, params.id);
});

export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const companyId = req.headers.get('x-company-id')!;
  return ReportController.delete(req, companyId, params.id);
});

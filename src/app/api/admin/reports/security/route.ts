import { NextRequest } from 'next/server';
import { ReportController } from '@/modules/platform-admin/controllers/report.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return ReportController.getSecurityReport(req);
});

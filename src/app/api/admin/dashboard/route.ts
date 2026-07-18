import { NextRequest } from 'next/server';
import { AdminDashboardController } from '@/modules/platform-admin/controllers/admin-dashboard.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return AdminDashboardController.getDashboardMetrics(req);
});

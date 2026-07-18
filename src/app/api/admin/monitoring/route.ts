import { NextRequest } from 'next/server';
import { MonitoringController } from '@/modules/platform-admin/controllers/monitoring.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return MonitoringController.getMetrics(req);
});

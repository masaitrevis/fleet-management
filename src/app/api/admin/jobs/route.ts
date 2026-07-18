import { NextRequest } from 'next/server';
import { JobController } from '@/modules/platform-admin/controllers/job.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return JobController.list(req);
});

import { NextRequest } from 'next/server';
import { JobController } from '@/modules/platform-admin/controllers/job.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const DELETE = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return JobController.cancel(req, id);
});

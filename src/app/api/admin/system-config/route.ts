import { NextRequest } from 'next/server';
import { SystemConfigController } from '@/modules/platform-admin/controllers/system-config.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return SystemConfigController.getAll(req);
});

export const PUT = withAdminAuth(async (req: NextRequest) => {
  return SystemConfigController.update(req);
});

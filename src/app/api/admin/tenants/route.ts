import { NextRequest } from 'next/server';
import { TenantController } from '@/modules/platform-admin/controllers/tenant.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return TenantController.list(req);
});

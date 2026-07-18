import { NextRequest } from 'next/server';
import { TenantController } from '@/modules/platform-admin/controllers/tenant.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return TenantController.suspend(req, id);
});

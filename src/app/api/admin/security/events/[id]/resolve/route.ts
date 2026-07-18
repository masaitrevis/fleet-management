import { NextRequest } from 'next/server';
import { SecurityController } from '@/modules/platform-admin/controllers/security.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return SecurityController.resolveEvent(req, id);
});

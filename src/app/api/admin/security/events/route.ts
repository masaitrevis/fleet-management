import { NextRequest } from 'next/server';
import { SecurityController } from '@/modules/platform-admin/controllers/security.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return SecurityController.listEvents(req);
});

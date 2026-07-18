import { NextRequest } from 'next/server';
import { PlatformUserController } from '@/modules/platform-admin/controllers/platform-user.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return PlatformUserController.list(req);
});

export const POST = withAdminAuth(async (req: NextRequest) => {
  return PlatformUserController.create(req);
});

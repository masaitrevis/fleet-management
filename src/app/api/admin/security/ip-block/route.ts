import { NextRequest, NextResponse } from 'next/server';
import { SecurityController } from '@/modules/platform-admin/controllers/security.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const POST = withAdminAuth(async (req: NextRequest) => {
  return SecurityController.blockIP(req);
});

export const DELETE = withAdminAuth(async (req: NextRequest) => {
  return SecurityController.unblockIP(req);
});

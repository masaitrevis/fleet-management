import { NextRequest } from 'next/server';
import { PlatformUserController } from '@/modules/platform-admin/controllers/platform-user.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return PlatformUserController.getById(req, id);
});

export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return PlatformUserController.update(req, id);
});

export const DELETE = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return PlatformUserController.delete(req, id);
});

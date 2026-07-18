import { NextRequest } from 'next/server';
import { FeatureFlagController } from '@/modules/platform-admin/controllers/feature-flag.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return FeatureFlagController.update(req, id);
});

export const DELETE = withAdminAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return FeatureFlagController.delete(req, id);
});

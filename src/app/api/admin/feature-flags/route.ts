import { NextRequest } from 'next/server';
import { FeatureFlagController } from '@/modules/platform-admin/controllers/feature-flag.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return FeatureFlagController.list(req);
});

export const POST = withAdminAuth(async (req: NextRequest) => {
  return FeatureFlagController.create(req);
});

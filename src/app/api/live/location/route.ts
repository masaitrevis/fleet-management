import { NextRequest } from 'next/server';
import { trackingController } from '@/modules/tracking/controllers/tracking.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('tracking:create')(
    async (req: NextRequest) => trackingController.postLocation(req)
  )
);

import { NextRequest } from 'next/server';
import { workshopController } from '@/modules/workshop/controllers/workshop.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => workshopController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest) => workshopController.create(req)
  )
);

import { NextRequest } from 'next/server';
import { mechanicController } from '@/modules/mechanic/controllers/mechanic.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => mechanicController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest) => mechanicController.create(req)
  )
);

import { NextRequest } from 'next/server';
import { routeController } from '@/modules/route/controllers/route.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('routes:read')(
    async (req: NextRequest) => routeController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('routes:create')(
    async (req: NextRequest) => routeController.create(req)
  )
);

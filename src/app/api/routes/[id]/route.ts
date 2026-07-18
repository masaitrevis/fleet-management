import { NextRequest } from 'next/server';
import { routeController } from '@/modules/route/controllers/route.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('routes:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => routeController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('routes:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => routeController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('routes:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => routeController.delete(req, { params })
  )
);

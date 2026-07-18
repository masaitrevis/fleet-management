import { NextRequest } from 'next/server';
import { tripController } from '@/modules/trip/controllers/trip.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('trips:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => tripController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('trips:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => tripController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('trips:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => tripController.delete(req, { params })
  )
);

import { NextRequest } from 'next/server';
import { tripController } from '@/modules/trip/controllers/trip.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('trips:read')(
    async (req: NextRequest) => tripController.getFilters(req)
  )
);

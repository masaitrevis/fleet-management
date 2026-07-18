import { NextRequest } from 'next/server';
import { tripController } from '@/modules/trip/controllers/trip.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('trips:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => tripController.completeTrip(req, { params })
  )
);

import { NextRequest } from 'next/server';
import { fleetController } from '@/modules/fleet/controllers/fleet.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fleet:read')(
    async (req: NextRequest) => fleetController.getAvailability(req)
  )
);

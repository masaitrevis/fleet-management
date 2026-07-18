import { NextRequest } from 'next/server';
import { vehicleDowntimeController } from '@/modules/vehicle-downtime/controllers/vehicle-downtime.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => vehicleDowntimeController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest) => vehicleDowntimeController.create(req)
  )
);

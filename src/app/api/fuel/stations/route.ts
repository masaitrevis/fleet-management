import { NextRequest } from 'next/server';
import { fuelStationController } from '@/modules/fuel-station/controllers/fuel-station.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest) => fuelStationController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('fuel:manage')(
    async (req: NextRequest) => fuelStationController.create(req)
  )
);

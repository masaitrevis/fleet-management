import { NextRequest } from 'next/server';
import { fuelLogController } from '@/modules/fuel-log/controllers/fuel-log.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest) => fuelLogController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('fuel:manage')(
    async (req: NextRequest) => fuelLogController.create(req)
  )
);

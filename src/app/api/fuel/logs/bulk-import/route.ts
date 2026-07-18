import { NextRequest } from 'next/server';
import { fuelLogController } from '@/modules/fuel-log/controllers/fuel-log.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('fuel:manage')(
    async (req: NextRequest) => fuelLogController.bulkImport(req)
  )
);

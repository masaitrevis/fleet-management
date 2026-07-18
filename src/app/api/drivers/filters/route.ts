import { NextRequest } from 'next/server';
import { driverController } from '@/modules/driver/controllers/driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('drivers:read')(
    async (req: NextRequest) => driverController.getFilters(req)
  )
);

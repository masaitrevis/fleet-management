import { NextRequest } from 'next/server';
import { driverController } from '@/modules/driver/controllers/driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('drivers:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => driverController.assignVehicle(req, { params })
  )
);

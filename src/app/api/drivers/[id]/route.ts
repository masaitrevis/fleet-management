import { NextRequest } from 'next/server';
import { driverController } from '@/modules/driver/controllers/driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('drivers:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => driverController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('drivers:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => driverController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('drivers:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => driverController.delete(req, { params })
  )
);

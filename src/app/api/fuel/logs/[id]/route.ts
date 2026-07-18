import { NextRequest } from 'next/server';
import { fuelLogController } from '@/modules/fuel-log/controllers/fuel-log.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return fuelLogController.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('fuel:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return fuelLogController.update(req, { params: { id } });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('fuel:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return fuelLogController.delete(req, { params: { id } });
    }
  )
);

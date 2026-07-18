import { NextRequest } from 'next/server';
import { shiftController } from '@/modules/shift/controllers/shift.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('shifts:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => shiftController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('shifts:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => shiftController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('shifts:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => shiftController.delete(req, { params })
  )
);

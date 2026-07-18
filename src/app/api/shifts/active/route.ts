import { NextRequest } from 'next/server';
import { shiftController } from '@/modules/shift/controllers/shift.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('shifts:read')(
    async (req: NextRequest) => shiftController.getActive(req)
  )
);

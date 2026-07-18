import { NextRequest } from 'next/server';
import { behaviorController } from '@/modules/behavior/controllers/behavior.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('drivers:read')(
    async (req: NextRequest, { params }: { params: { driverId: string } }) => behaviorController.getPeriods(req, { params })
  )
);

import { NextRequest } from 'next/server';
import { fuelFraudController } from '@/modules/fuel-fraud/controllers/fuel-fraud.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest) => fuelFraudController.getAll(req)
  )
);

import { NextRequest } from 'next/server';
import { fuelFraudController } from '@/modules/fuel-fraud/controllers/fuel-fraud.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('fuel:manage')(
    async (req: NextRequest, { params }: { params: { id: string } }) => fuelFraudController.updateStatus(req, { params })
  )
);

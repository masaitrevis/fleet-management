import { NextRequest } from 'next/server';
import { fuelFraudController } from '@/modules/fuel-fraud/controllers/fuel-fraud.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('fuel:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return fuelFraudController.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('fuel:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return fuelFraudController.updateStatus(req, { params: { id } });
    }
  )
);

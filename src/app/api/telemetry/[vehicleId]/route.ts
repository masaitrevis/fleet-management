import { NextRequest } from 'next/server';
import { telemetryController } from '@/modules/telemetry/controllers/telemetry.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('telemetry:read')(
    async (req: NextRequest, { params }: { params: { vehicleId: string } }) => telemetryController.getByVehicle(req, { params })
  )
);

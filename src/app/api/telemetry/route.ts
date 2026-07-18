import { NextRequest } from 'next/server';
import { telemetryController } from '@/modules/telemetry/controllers/telemetry.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('telemetry:create')(
    async (req: NextRequest) => telemetryController.postTelemetry(req)
  )
);

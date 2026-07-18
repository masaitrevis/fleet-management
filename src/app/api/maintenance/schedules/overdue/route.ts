import { NextRequest } from 'next/server';
import { maintenanceScheduleController } from '@/modules/maintenance-schedule/controllers/maintenance-schedule.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => maintenanceScheduleController.getOverdue(req)
  )
);

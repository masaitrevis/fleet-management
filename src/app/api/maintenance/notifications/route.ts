import { NextRequest } from 'next/server';
import { maintenanceNotificationController } from '@/modules/maintenance-notification/controllers/maintenance-notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => maintenanceNotificationController.getAll(req)
  )
);

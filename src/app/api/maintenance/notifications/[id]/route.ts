import { NextRequest } from 'next/server';
import { maintenanceNotificationController } from '@/modules/maintenance-notification/controllers/maintenance-notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('maintenance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceNotificationController.markRead(req, { params: { id } });
    }
  )
);

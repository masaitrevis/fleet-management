import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationController.markReadAll(req, companyId);
    }
  )
);

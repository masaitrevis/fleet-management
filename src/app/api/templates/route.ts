import { NextRequest } from 'next/server';
import { notificationTemplateController } from '@/modules/notification-template/controllers/notification-template.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationTemplateController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationTemplateController.create(req, companyId);
    }
  )
);
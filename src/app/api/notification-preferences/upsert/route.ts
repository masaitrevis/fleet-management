import { NextRequest } from 'next/server';
import { notificationPreferenceController } from '@/modules/notification-preference/controllers/notification-preference.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationPreferenceController.upsert(req, companyId);
    }
  )
);

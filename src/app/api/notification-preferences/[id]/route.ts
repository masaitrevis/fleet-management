import { NextRequest } from 'next/server';
import { notificationPreferenceController } from '@/modules/notification-preference/controllers/notification-preference.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationPreferenceController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationPreferenceController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('notifications:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationPreferenceController.delete(req, companyId, id);
    }
  )
);
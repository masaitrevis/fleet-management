import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('notifications:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationController.delete(req, companyId, id);
    }
  )
);
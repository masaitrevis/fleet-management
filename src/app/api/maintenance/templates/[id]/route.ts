import { NextRequest } from 'next/server';
import { serviceTemplateController } from '@/modules/service-template/controllers/service-template.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return serviceTemplateController.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('maintenance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return serviceTemplateController.update(req, { params: { id } });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('maintenance:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return serviceTemplateController.delete(req, { params: { id } });
    }
  )
);

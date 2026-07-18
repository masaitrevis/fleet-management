import { NextRequest } from 'next/server';
import { serviceTemplateController } from '@/modules/service-template/controllers/service-template.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return serviceTemplateController.addItem(req, { params: { id } });
    }
  )
);

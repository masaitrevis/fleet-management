import { NextRequest } from 'next/server';
import { serviceTemplateController } from '@/modules/service-template/controllers/service-template.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => serviceTemplateController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest) => serviceTemplateController.create(req)
  )
);

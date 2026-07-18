import { NextRequest } from 'next/server';
import { roleController } from '@/modules/role/controllers/role.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('roles:manage')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return roleController.clone(req, { params });
    }
  )
);

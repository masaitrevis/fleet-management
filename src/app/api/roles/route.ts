import { NextRequest } from 'next/server';
import { roleController } from '@/modules/role/controllers/role.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('roles:manage')(
    async (req: NextRequest) => {
      return roleController.getAll(req);
    }
  )
);

export const POST = withAuth(
  requirePermission('roles:manage')(
    async (req: NextRequest) => {
      return roleController.create(req);
    }
  )
);

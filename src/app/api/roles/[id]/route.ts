import { NextRequest } from 'next/server';
import { roleController } from '@/modules/role/controllers/role.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('roles:manage')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return roleController.getById(req, { params });
    }
  )
);

export const PUT = withAuth(
  requirePermission('roles:manage')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return roleController.update(req, { params });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('roles:manage')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return roleController.delete(req, { params });
    }
  )
);

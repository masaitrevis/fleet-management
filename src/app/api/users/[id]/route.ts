import { NextRequest } from 'next/server';
import { userController } from '@/modules/user/controllers/user.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('users:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return userController.getById(req, { params });
    }
  )
);

export const PUT = withAuth(
  requirePermission('users:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return userController.update(req, { params });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('users:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return userController.delete(req, { params });
    }
  )
);

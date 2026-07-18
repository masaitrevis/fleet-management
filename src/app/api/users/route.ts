import { NextRequest } from 'next/server';
import { userController } from '@/modules/user/controllers/user.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('users:read')(
    async (req: NextRequest) => {
      return userController.getAll(req);
    }
  )
);

export const POST = withAuth(
  requirePermission('users:create')(
    async (req: NextRequest) => {
      return userController.create(req);
    }
  )
);

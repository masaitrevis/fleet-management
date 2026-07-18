import { NextRequest } from 'next/server';
import { userController } from '@/modules/user/controllers/user.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('users:create')(
    async (req: NextRequest) => {
      return userController.invite(req);
    }
  )
);

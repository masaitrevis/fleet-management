import { NextRequest } from 'next/server';
import { userController } from '@/modules/user/controllers/user.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('users:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return userController.activate(req, { params });
    }
  )
);

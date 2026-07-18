import { NextRequest } from 'next/server';
import { invitationController } from '@/modules/invitation/controllers/invitation.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('users:create')(
    async (req: NextRequest) => {
      return invitationController.getAll(req);
    }
  )
);

export const POST = withAuth(
  requirePermission('users:create')(
    async (req: NextRequest) => {
      return invitationController.create(req);
    }
  )
);

import { NextRequest } from 'next/server';
import { invitationController } from '@/modules/invitation/controllers/invitation.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const DELETE = withAuth(
  requirePermission('users:create')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return invitationController.cancel(req, { params });
    }
  )
);

export const POST = withAuth(
  requirePermission('users:create')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return invitationController.resend(req, { params });
    }
  )
);

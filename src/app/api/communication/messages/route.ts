import { NextRequest } from 'next/server';
import { communicationCenterController } from '@/modules/communication-center/controllers/communication-center.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return communicationCenterController.createMessage(req, companyId);
    }
  )
);

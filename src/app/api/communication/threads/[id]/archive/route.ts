import { NextRequest } from 'next/server';
import { communicationCenterController } from '@/modules/communication-center/controllers/communication-center.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return communicationCenterController.archiveThread(req, companyId, id);
    }
  )
);

import { NextRequest } from 'next/server';
import { approvalRequestController } from '@/modules/approval-workflow/controllers/approval-workflow.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('approvals:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return approvalRequestController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('approvals:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return approvalRequestController.create(req, companyId);
    }
  )
);
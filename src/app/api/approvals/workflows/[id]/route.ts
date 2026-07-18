import { NextRequest } from 'next/server';
import { approvalWorkflowController } from '@/modules/approval-workflow/controllers/approval-workflow.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('approvals:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return approvalWorkflowController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('approvals:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return approvalWorkflowController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('approvals:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return approvalWorkflowController.delete(req, companyId, id);
    }
  )
);
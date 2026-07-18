import { NextRequest } from 'next/server';
import { complianceRuleController } from '@/modules/compliance-rule/controllers/compliance-rule.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('compliance:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return complianceRuleController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('compliance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return complianceRuleController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('compliance:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return complianceRuleController.delete(req, companyId, id);
    }
  )
);
import { NextRequest } from 'next/server';
import { complianceRuleController } from '@/modules/compliance-rule/controllers/compliance-rule.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('compliance:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return complianceRuleController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('compliance:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return complianceRuleController.create(req, companyId);
    }
  )
);
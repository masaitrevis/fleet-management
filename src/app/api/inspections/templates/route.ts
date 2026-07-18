import { NextRequest } from 'next/server';
import { inspectionTemplateController } from '@/modules/inspection-template/controllers/inspection-template.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inspections:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inspectionTemplateController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('inspections:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inspectionTemplateController.create(req, companyId);
    }
  )
);
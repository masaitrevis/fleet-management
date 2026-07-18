import { NextRequest } from 'next/server';
import { inspectionTemplateController } from '@/modules/inspection-template/controllers/inspection-template.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inspections:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inspectionTemplateController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('inspections:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inspectionTemplateController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('inspections:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inspectionTemplateController.delete(req, companyId, id);
    }
  )
);
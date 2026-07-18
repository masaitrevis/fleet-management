import { NextRequest } from 'next/server';
import { correctiveActionController } from '@/modules/corrective-action/controllers/corrective-action.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('corrective:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return correctiveActionController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('corrective:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return correctiveActionController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('corrective:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return correctiveActionController.delete(req, companyId, id);
    }
  )
);
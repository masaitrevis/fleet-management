import { NextRequest } from 'next/server';
import { incidentController } from '@/modules/incident/controllers/incident.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('incidents:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return incidentController.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('incidents:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return incidentController.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('incidents:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return incidentController.delete(req, companyId, id);
    }
  )
);
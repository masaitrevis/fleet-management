import { NextRequest } from 'next/server';
import { incidentController } from '@/modules/incident/controllers/incident.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('incidents:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return incidentController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('incidents:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return incidentController.create(req, companyId);
    }
  )
);
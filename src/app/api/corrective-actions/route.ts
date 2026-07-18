import { NextRequest } from 'next/server';
import { correctiveActionController } from '@/modules/corrective-action/controllers/corrective-action.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('corrective:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return correctiveActionController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('corrective:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return correctiveActionController.create(req, companyId);
    }
  )
);
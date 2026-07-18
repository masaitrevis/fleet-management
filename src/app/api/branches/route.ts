import { NextRequest } from 'next/server';
import { branchController } from '@/modules/branch/controllers/branch.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('company:read')(
    async (req: NextRequest) => {
      return branchController.getAll(req);
    }
  )
);

export const POST = withAuth(
  requirePermission('company:update')(
    async (req: NextRequest) => {
      return branchController.create(req);
    }
  )
);

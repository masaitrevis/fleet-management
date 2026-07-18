import { NextRequest } from 'next/server';
import { branchController } from '@/modules/branch/controllers/branch.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('company:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return branchController.getById(req, { params });
    }
  )
);

export const PUT = withAuth(
  requirePermission('company:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return branchController.update(req, { params });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('company:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return branchController.delete(req, { params });
    }
  )
);

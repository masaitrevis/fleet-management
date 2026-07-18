import { NextRequest } from 'next/server';
import { departmentController } from '@/modules/department/controllers/department.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('company:read')(
    async (req: NextRequest) => {
      return departmentController.getAll(req);
    }
  )
);

export const POST = withAuth(
  requirePermission('company:update')(
    async (req: NextRequest) => {
      return departmentController.create(req);
    }
  )
);

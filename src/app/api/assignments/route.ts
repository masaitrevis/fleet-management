import { NextRequest } from 'next/server';
import { assignmentController } from '@/modules/assignment/controllers/assignment.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('assignments:read')(
    async (req: NextRequest) => assignmentController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('assignments:create')(
    async (req: NextRequest) => assignmentController.create(req)
  )
);

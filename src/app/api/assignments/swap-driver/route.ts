import { NextRequest } from 'next/server';
import { assignmentController } from '@/modules/assignment/controllers/assignment.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('assignments:update')(
    async (req: NextRequest) => assignmentController.swapDriver(req)
  )
);

import { NextRequest } from 'next/server';
import { assignmentController } from '@/modules/assignment/controllers/assignment.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('assignments:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => assignmentController.getById(req, { params })
  )
);

export const PUT = withAuth(
  requirePermission('assignments:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => assignmentController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('assignments:delete')(
    async (req: NextRequest, { params }: { params: { id: string } }) => assignmentController.delete(req, { params })
  )
);

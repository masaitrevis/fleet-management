import { NextRequest } from 'next/server';
import { alertController } from '@/modules/alert/controllers/alert.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('alerts:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => alertController.getById(req, { params })
  )
);

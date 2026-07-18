import { NextRequest } from 'next/server';
import { alertController } from '@/modules/alert/controllers/alert.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('alerts:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => alertController.acknowledge(req, { params })
  )
);

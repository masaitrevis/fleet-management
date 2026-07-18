import { NextRequest } from 'next/server';
import { workshopController } from '@/modules/workshop/controllers/workshop.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return workshopController.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('maintenance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return workshopController.update(req, { params: { id } });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('maintenance:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return workshopController.delete(req, { params: { id } });
    }
  )
);

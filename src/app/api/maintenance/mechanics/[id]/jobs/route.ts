import { NextRequest } from 'next/server';
import { mechanicController } from '@/modules/mechanic/controllers/mechanic.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return mechanicController.getJobs(req, { params: { id } });
    }
  )
);

import { NextRequest } from 'next/server';
import { maintenanceScheduleController } from '@/modules/maintenance-schedule/controllers/maintenance-schedule.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceScheduleController.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('maintenance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceScheduleController.update(req, { params: { id } });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('maintenance:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceScheduleController.delete(req, { params: { id } });
    }
  )
);

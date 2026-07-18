import { NextRequest } from 'next/server';
import { maintenanceRecordController } from '@/modules/maintenance-record/controllers/maintenance-record.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceRecordController.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('maintenance:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceRecordController.update(req, { params: { id } });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('maintenance:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceRecordController.delete(req, { params: { id } });
    }
  )
);

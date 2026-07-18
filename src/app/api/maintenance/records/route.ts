import { NextRequest } from 'next/server';
import { maintenanceRecordController } from '@/modules/maintenance-record/controllers/maintenance-record.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('maintenance:read')(
    async (req: NextRequest) => maintenanceRecordController.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest) => maintenanceRecordController.create(req)
  )
);

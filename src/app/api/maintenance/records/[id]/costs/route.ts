import { NextRequest } from 'next/server';
import { maintenanceRecordController } from '@/modules/maintenance-record/controllers/maintenance-record.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('maintenance:manage')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return maintenanceRecordController.addCost(req, { params: { id } });
    }
  )
);

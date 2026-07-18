import { NextRequest } from 'next/server';
import { driverDocumentController } from '@/modules/driver/controllers/driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('drivers:update')(
    async (req: NextRequest, { params }: { params: { id: string; documentId: string } }) => driverDocumentController.update(req, { params })
  )
);

export const DELETE = withAuth(
  requirePermission('drivers:update')(
    async (req: NextRequest, { params }: { params: { id: string; documentId: string } }) => driverDocumentController.delete(req, { params })
  )
);

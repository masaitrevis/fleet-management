import { NextRequest } from 'next/server';
import { driverDocumentController } from '@/modules/driver/controllers/driver.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('drivers:read')(
    async (req: NextRequest, { params }: { params: { id: string } }) => driverDocumentController.getAll(req, { params })
  )
);

export const POST = withAuth(
  requirePermission('drivers:update')(
    async (req: NextRequest, { params }: { params: { id: string } }) => driverDocumentController.create(req, { params })
  )
);

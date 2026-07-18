import { NextRequest } from 'next/server';
import { BackupController } from '@/modules/platform-admin/controllers/backup.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return BackupController.list(req);
});

export const POST = withAdminAuth(async (req: NextRequest) => {
  return BackupController.create(req);
});

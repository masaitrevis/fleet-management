import { NextRequest } from 'next/server';
import { AuditLogController } from '@/modules/platform-admin/controllers/audit-log.controller';
import { withAdminAuth } from '@/modules/platform-admin/middleware/admin-auth.middleware';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return AuditLogController.list(req);
});

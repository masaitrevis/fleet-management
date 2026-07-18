const fs = require('fs');
const path = require('path');

const API = '/root/.openclaw/workspace/fleet-management-saas/src/app/api';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(f, c) { mkdir(path.dirname(f)); fs.writeFileSync(f, c); }

function listRoute(controller, ctrlImport, permPrefix) {
  return `import { NextRequest } from 'next/server';
import { ${controller} } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${permPrefix}:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${controller}.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('${permPrefix}:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${controller}.create(req, companyId);
    }
  )
);`;
}

function detailRoute(controller, ctrlImport, permPrefix) {
  return `import { NextRequest } from 'next/server';
import { ${controller} } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${permPrefix}:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${controller}.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('${permPrefix}:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${controller}.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('${permPrefix}:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${controller}.delete(req, companyId, id);
    }
  )
);`;
}

// Notifications
write(`${API}/notifications/route.ts`, `import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationController.create(req, companyId);
    }
  )
);
`);

write(`${API}/notifications/[id]/route.ts`, detailRoute('notificationController', '@/modules/notification/controllers/notification.controller', 'notifications'));

write(`${API}/notifications/[id]/read/route.ts`, `import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationController.markRead(req, companyId, id);
    }
  )
);
`);

write(`${API}/notifications/read-all/route.ts`, `import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationController.markReadAll(req, companyId);
    }
  )
);
`);

write(`${API}/notifications/[id]/archive/route.ts`, `import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return notificationController.archive(req, companyId, id);
    }
  )
);
`);

write(`${API}/notifications/unread-count/route.ts`, `import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationController.getUnreadCount(req, companyId);
    }
  )
);
`);

write(`${API}/notifications/stats/route.ts`, `import { NextRequest } from 'next/server';
import { notificationController } from '@/modules/notification/controllers/notification.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationController.getStats(req, companyId);
    }
  )
);
`);

// Notification Preferences
write(`${API}/notification-preferences/route.ts`, `import { NextRequest } from 'next/server';
import { notificationPreferenceController } from '@/modules/notification-preference/controllers/notification-preference.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationPreferenceController.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationPreferenceController.create(req, companyId);
    }
  )
);
`);

write(`${API}/notification-preferences/[id]/route.ts`, detailRoute('notificationPreferenceController', '@/modules/notification-preference/controllers/notification-preference.controller', 'notifications'));

write(`${API}/notification-preferences/upsert/route.ts`, `import { NextRequest } from 'next/server';
import { notificationPreferenceController } from '@/modules/notification-preference/controllers/notification-preference.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return notificationPreferenceController.upsert(req, companyId);
    }
  )
);
`);

// Notification Templates
write(`${API}/templates/route.ts`, listRoute('notificationTemplateController', '@/modules/notification-template/controllers/notification-template.controller', 'notifications'));
write(`${API}/templates/[id]/route.ts`, detailRoute('notificationTemplateController', '@/modules/notification-template/controllers/notification-template.controller', 'notifications'));

// Delivery Queue
write(`${API}/delivery-queue/route.ts`, listRoute('deliveryQueueController', '@/modules/delivery-queue/controllers/delivery-queue.controller', 'notifications'));
write(`${API}/delivery-queue/[id]/route.ts`, detailRoute('deliveryQueueController', '@/modules/delivery-queue/controllers/delivery-queue.controller', 'notifications'));

write(`${API}/delivery-queue/pending/route.ts`, `import { NextRequest } from 'next/server';
import { deliveryQueueController } from '@/modules/delivery-queue/controllers/delivery-queue.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return deliveryQueueController.getPending(req, companyId);
    }
  )
);
`);

// Communication Center
write(`${API}/communication/threads/route.ts`, `import { NextRequest } from 'next/server';
import { communicationCenterController } from '@/modules/communication-center/controllers/communication-center.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return communicationCenterController.getThreads(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return communicationCenterController.createThread(req, companyId);
    }
  )
);
`);

write(`${API}/communication/threads/[id]/route.ts`, `import { NextRequest } from 'next/server';
import { communicationCenterController } from '@/modules/communication-center/controllers/communication-center.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('notifications:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return communicationCenterController.getThreadById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return communicationCenterController.markThreadRead(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('notifications:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return communicationCenterController.deleteThread(req, companyId, id);
    }
  )
);
`);

write(`${API}/communication/threads/[id]/archive/route.ts`, `import { NextRequest } from 'next/server';
import { communicationCenterController } from '@/modules/communication-center/controllers/communication-center.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('notifications:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return communicationCenterController.archiveThread(req, companyId, id);
    }
  )
);
`);

write(`${API}/communication/messages/route.ts`, `import { NextRequest } from 'next/server';
import { communicationCenterController } from '@/modules/communication-center/controllers/communication-center.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const POST = withAuth(
  requirePermission('notifications:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return communicationCenterController.createMessage(req, companyId);
    }
  )
);
`);

console.log('Phase 14 API routes created');

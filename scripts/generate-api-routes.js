const fs = require('fs');
const path = require('path');

const API_BASE = '/root/.openclaw/workspace/fleet-management-saas/src/app/api/inventory';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function listRoute(name, ctrlImport, perm) {
  return `import { NextRequest } from 'next/server';
import { ${name}Controller } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${perm}:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${name}Controller.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('${perm}:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${name}Controller.create(req, companyId);
    }
  )
);`;
}

function detailRoute(name, ctrlImport, perm) {
  return `import { NextRequest } from 'next/server';
import { ${name}Controller } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${perm}:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${name}Controller.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('${perm}:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${name}Controller.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('${perm}:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${name}Controller.delete(req, companyId, id);
    }
  )
);`;
}

const routes = [
  ['warehouses', 'Warehouse', '@/modules/warehouse/controllers/warehouse.controller', 'inventory'],
  ['categories', 'PartCategory', '@/modules/part-category/controllers/part-category.controller', 'inventory'],
  ['parts', 'InventoryPart', '@/modules/inventory-part/controllers/inventory-part.controller', 'inventory'],
  ['stock', 'Stock', '@/modules/stock/controllers/stock.controller', 'inventory'],
  ['movements', 'StockMovement', '@/modules/stock-movement/controllers/stock-movement.controller', 'inventory'],
  ['suppliers', 'Supplier', '@/modules/supplier/controllers/supplier.controller', 'inventory'],
  ['purchase-orders', 'PurchaseOrder', '@/modules/purchase-order/controllers/purchase-order.controller', 'inventory'],
  ['transfers', 'WarehouseTransfer', '@/modules/warehouse-transfer/controllers/warehouse-transfer.controller', 'inventory'],
  ['tools', 'Tool', '@/modules/tool/controllers/tool.controller', 'inventory'],
  ['alerts', 'InventoryAlert', '@/modules/inventory-alert/controllers/inventory-alert.controller', 'inventory'],
];

for (const [route, name, ctrl, perm] of routes) {
  writeFile(`${API_BASE}/${route}/route.ts`, listRoute(name, ctrl, perm));
  writeFile(`${API_BASE}/${route}/[id]/route.ts`, detailRoute(name, ctrl, perm));
}

// Inventory analytics
writeFile(`${API_BASE}/analytics/route.ts`, `import { NextRequest } from 'next/server';
import { inventoryAnalyticsController } from '@/modules/inventory-analytics/controllers/inventory-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inventoryAnalyticsController.overview(req, companyId);
    }
  )
);`);

writeFile(`${API_BASE}/analytics/stock-value/route.ts`, `import { NextRequest } from 'next/server';
import { inventoryAnalyticsController } from '@/modules/inventory-analytics/controllers/inventory-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inventoryAnalyticsController.stockValue(req, companyId);
    }
  )
);`);

writeFile(`${API_BASE}/analytics/top-moving/route.ts`, `import { NextRequest } from 'next/server';
import { inventoryAnalyticsController } from '@/modules/inventory-analytics/controllers/inventory-analytics.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inventoryAnalyticsController.topMoving(req, companyId);
    }
  )
);`);

// Alerts unread count
writeFile(`${API_BASE}/alerts/unread-count/route.ts`, `import { NextRequest } from 'next/server';
import { inventoryAlertController } from '@/modules/inventory-alert/controllers/inventory-alert.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return inventoryAlertController.unreadCount(req, companyId);
    }
  )
);`);

// Alert mark-as-read and resolve
writeFile(`${API_BASE}/alerts/[id]/read/route.ts`, `import { NextRequest } from 'next/server';
import { inventoryAlertController } from '@/modules/inventory-alert/controllers/inventory-alert.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('inventory:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inventoryAlertController.markAsRead(req, companyId, id);
    }
  )
);`);

writeFile(`${API_BASE}/alerts/[id]/resolve/route.ts`, `import { NextRequest } from 'next/server';
import { inventoryAlertController } from '@/modules/inventory-alert/controllers/inventory-alert.controller';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const PUT = withAuth(
  requirePermission('inventory:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return inventoryAlertController.resolve(req, companyId, id);
    }
  )
);`);

console.log('All API routes created');

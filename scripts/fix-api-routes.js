const fs = require('fs');
const path = require('path');

const API_BASE = '/root/.openclaw/workspace/fleet-management-saas/src/app/api/inventory';

function fixRoutes(dir, correctName) {
  const files = fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.ts'));
  for (const file of files) {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    // Fix class name references to camelCase export names
    const wrongNames = ['WarehouseController', 'PartCategoryController', 'InventoryPartController', 'StockController', 'StockMovementController', 'SupplierController', 'PurchaseOrderController', 'WarehouseTransferController', 'ToolController', 'InventoryAlertController', 'InventoryAnalyticsController'];
    for (const wrong of wrongNames) {
      const right = wrong.charAt(0).toLowerCase() + wrong.slice(1);
      content = content.replace(new RegExp(wrong, 'g'), right);
    }
    fs.writeFileSync(fp, content);
  }
}

// Actually let's just fix each route file properly
const routes = [
  ['warehouses', 'warehouseController', '@/modules/warehouse/controllers/warehouse.controller'],
  ['categories', 'partcategoryController', '@/modules/part-category/controllers/part-category.controller'],
  ['parts', 'inventorypartController', '@/modules/inventory-part/controllers/inventory-part.controller'],
  ['stock', 'stockController', '@/modules/stock/controllers/stock.controller'],
  ['movements', 'stockMovementController', '@/modules/stock-movement/controllers/stock-movement.controller'],
  ['suppliers', 'supplierController', '@/modules/supplier/controllers/supplier.controller'],
  ['purchase-orders', 'purchaseOrderController', '@/modules/purchase-order/controllers/purchase-order.controller'],
  ['transfers', 'warehouseTransferController', '@/modules/warehouse-transfer/controllers/warehouse-transfer.controller'],
  ['tools', 'toolController', '@/modules/tool/controllers/tool.controller'],
  ['alerts', 'inventoryAlertController', '@/modules/inventory-alert/controllers/inventory-alert.controller'],
];

function listRoute(ctrlName, ctrlImport) {
  return `import { NextRequest } from 'next/server';
import { ${ctrlName} } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${ctrlName}.getAll(req, companyId);
    }
  )
);

export const POST = withAuth(
  requirePermission('inventory:manage')(
    async (req: NextRequest) => {
      const companyId = req.headers.get('x-company-id')!;
      return ${ctrlName}.create(req, companyId);
    }
  )
);`;
}

function detailRoute(ctrlName, ctrlImport) {
  return `import { NextRequest } from 'next/server';
import { ${ctrlName} } from '${ctrlImport}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('inventory:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${ctrlName}.getById(req, companyId, id);
    }
  )
);

export const PUT = withAuth(
  requirePermission('inventory:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${ctrlName}.update(req, companyId, id);
    }
  )
);

export const DELETE = withAuth(
  requirePermission('inventory:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const companyId = req.headers.get('x-company-id')!;
      const { id } = await params;
      return ${ctrlName}.delete(req, companyId, id);
    }
  )
);`;
}

for (const [route, name, ctrlImport] of routes) {
  fs.writeFileSync(`${API_BASE}/${route}/route.ts`, listRoute(name, ctrlImport));
  fs.writeFileSync(`${API_BASE}/${route}/[id]/route.ts`, detailRoute(name, ctrlImport));
}

// Fix special routes
fs.writeFileSync(`${API_BASE}/analytics/route.ts`, `import { NextRequest } from 'next/server';
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

fs.writeFileSync(`${API_BASE}/analytics/stock-value/route.ts`, `import { NextRequest } from 'next/server';
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

fs.writeFileSync(`${API_BASE}/analytics/top-moving/route.ts`, `import { NextRequest } from 'next/server';
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

fs.writeFileSync(`${API_BASE}/alerts/unread-count/route.ts`, `import { NextRequest } from 'next/server';
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

fs.writeFileSync(`${API_BASE}/alerts/[id]/read/route.ts`, `import { NextRequest } from 'next/server';
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

fs.writeFileSync(`${API_BASE}/alerts/[id]/resolve/route.ts`, `import { NextRequest } from 'next/server';
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

console.log('All API routes fixed with correct controller names');

const fs = require('fs');
const path = require('path');

const MODULES_BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';
const API_BASE = '/root/.openclaw/workspace/fleet-management-saas/src/app/api/inventory';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function fixController(modulePath, serviceName, methods) {
  let content = fs.readFileSync(modulePath, 'utf8');
  // Replace method signatures to get companyId from headers
  content = content.replace(
    new RegExp(`async getAll\\(req: NextRequest, companyId: string\\)`, 'g'),
    `async getAll(req: NextRequest)`
  );
  content = content.replace(
    new RegExp(`await ${serviceName}\\.getAll\\(companyId,`, 'g'),
    `const companyId = req.headers.get('x-company-id')!;\n      await ${serviceName}.getAll(companyId,`
  );
  
  // For getById, update, delete - need to handle params
  content = content.replace(
    new RegExp(`async getById\\(req: NextRequest, companyId: string, id: string\\)`, 'g'),
    `async getById(req: NextRequest, { params }: { params: { id: string } })`
  );
  content = content.replace(
    new RegExp(`await ${serviceName}\\.getById\\(id, companyId\\)`, 'g'),
    `const companyId = req.headers.get('x-company-id')!;\n      await ${serviceName}.getById(params.id, companyId)`
  );
  
  content = content.replace(
    new RegExp(`async create\\(req: NextRequest, companyId: string\\)`, 'g'),
    `async create(req: NextRequest)`
  );
  content = content.replace(
    new RegExp(`await ${serviceName}\\.create\\(companyId,`, 'g'),
    `const companyId = req.headers.get('x-company-id')!;\n      await ${serviceName}.create(companyId,`
  );
  
  content = content.replace(
    new RegExp(`async update\\(req: NextRequest, companyId: string, id: string\\)`, 'g'),
    `async update(req: NextRequest, { params }: { params: { id: string } })`
  );
  content = content.replace(
    new RegExp(`await ${serviceName}\\.update\\(id, companyId,`, 'g'),
    `const companyId = req.headers.get('x-company-id')!;\n      await ${serviceName}.update(params.id, companyId,`
  );
  
  content = content.replace(
    new RegExp(`async delete\\(req: NextRequest, companyId: string, id: string\\)`, 'g'),
    `async delete(req: NextRequest, { params }: { params: { id: string } })`
  );
  content = content.replace(
    new RegExp(`await ${serviceName}\\.delete\\(id, companyId\\)`, 'g'),
    `const companyId = req.headers.get('x-company-id')!;\n      await ${serviceName}.delete(params.id, companyId)`
  );
  
  fs.writeFileSync(modulePath, content);
}

// Fix all controllers to match fuel-log pattern
const controllers = [
  ['warehouse', 'warehouseService', ['getAll','getById','create','update','delete']],
  ['part-category', 'partCategoryService', ['getAll','getById','create','update','delete']],
  ['inventory-part', 'inventoryPartService', ['getAll','getById','create','update','delete']],
  ['stock', 'stockService', ['getAll','getById','create','update','delete']],
  ['supplier', 'supplierService', ['getAll','getById','create','update','delete']],
  ['tool', 'toolService', ['getAll','getById','create','update','delete']],
];

for (const [dir, svc, methods] of controllers) {
  fixController(`${MODULES_BASE}/${dir}/controllers/${dir.replace(/-/g,'')}.controller.ts`, svc, methods);
}

// Now create API routes
function createListRoute(moduleName, controllerPath, permissionPrefix) {
  const name = moduleName.replace(/-/g, '');
  return `import { NextRequest } from 'next/server';
import { ${name}Controller } from '${controllerPath}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${permissionPrefix}:read')(
    async (req: NextRequest) => ${name}Controller.getAll(req)
  )
);

export const POST = withAuth(
  requirePermission('${permissionPrefix}:manage')(
    async (req: NextRequest) => ${name}Controller.create(req)
  )
);`;
}

function createDetailRoute(moduleName, controllerPath, permissionPrefix) {
  const name = moduleName.replace(/-/g, '');
  return `import { NextRequest } from 'next/server';
import { ${name}Controller } from '${controllerPath}';
import { withAuth } from '@/modules/auth/middleware/auth.middleware';
import { requirePermission } from '@/modules/auth/middleware/rbac.middleware';

export const GET = withAuth(
  requirePermission('${permissionPrefix}:read')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return ${name}Controller.getById(req, { params: { id } });
    }
  )
);

export const PUT = withAuth(
  requirePermission('${permissionPrefix}:update')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return ${name}Controller.update(req, { params: { id } });
    }
  )
);

export const DELETE = withAuth(
  requirePermission('${permissionPrefix}:delete')(
    async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
      const { id } = await params;
      return ${name}Controller.delete(req, { params: { id } });
    }
  )
);`;
}

const routes = [
  ['warehouses', '@/modules/warehouse/controllers/warehouse.controller', 'inventory'],
  ['categories', '@/modules/part-category/controllers/part-category.controller', 'inventory'],
  ['parts', '@/modules/inventory-part/controllers/inventory-part.controller', 'inventory'],
  ['stock', '@/modules/stock/controllers/stock.controller', 'inventory'],
  ['suppliers', '@/modules/supplier/controllers/supplier.controller', 'inventory'],
  ['tools', '@/modules/tool/controllers/tool.controller', 'inventory'],
];

for (const [route, ctrlPath, perm] of routes) {
  writeFile(`${API_BASE}/${route}/route.ts`, createListRoute(route, ctrlPath, perm));
  writeFile(`${API_BASE}/${route}/[id]/route.ts`, createDetailRoute(route, ctrlPath, perm));
}

console.log('Controllers fixed and basic API routes created');

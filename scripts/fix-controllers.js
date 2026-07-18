const fs = require('fs');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function writeController(moduleName, serviceName, createSchema, updateSchema, searchSchema, extraImports = '') {
  const content = `import { NextRequest, NextResponse } from 'next/server';
import { ${serviceName} } from '../services/${moduleName}.service';
import { ${createSchema}, ${updateSchema}, ${searchSchema} } from '../validators/${moduleName}.validator';
import { AppError } from '@/shared/errors/AppError';
${extraImports}

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 }
  );
}

export class ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace(/Service$/, '')}Controller {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = ${searchSchema}.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await ${serviceName}.getAll(companyId, search);
      return successResponse(result);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try {
      const item = await ${serviceName}.getById(id, companyId);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async create(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const data = ${createSchema}.parse(body);
      const item = await ${serviceName}.create(companyId, data);
      return successResponse(item, 201);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try {
      const body = await req.json();
      const data = ${updateSchema}.parse(body);
      const item = await ${serviceName}.update(id, companyId, data);
      return successResponse(item);
    } catch (error) {
      return errorResponse(error as Error);
    }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try {
      await ${serviceName}.delete(id, companyId);
      return successResponse({ message: 'Deleted successfully' });
    } catch (error) {
      return errorResponse(error as Error);
    }
  }
}

export const ${moduleName.replace(/-/g, '')}Controller = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace(/Service$/, '')}Controller();
`;
  fs.writeFileSync(`${BASE}/${moduleName}/controllers/${moduleName}.controller.ts`, content);
}

writeController('warehouse', 'warehouseService', 'createWarehouseSchema', 'updateWarehouseSchema', 'warehouseSearchSchema');
writeController('part-category', 'partCategoryService', 'createPartCategorySchema', 'updatePartCategorySchema', 'partCategorySearchSchema');
writeController('inventory-part', 'inventoryPartService', 'createInventoryPartSchema', 'updateInventoryPartSchema', 'inventoryPartSearchSchema');
writeController('stock', 'stockService', 'createStockSchema', 'updateStockSchema', 'stockSearchSchema');
writeController('supplier', 'supplierService', 'createSupplierSchema', 'updateSupplierSchema', 'supplierSearchSchema');
writeController('tool', 'toolService', 'createToolSchema', 'updateToolSchema', 'toolSearchSchema');

console.log('All corrupted controllers fixed');

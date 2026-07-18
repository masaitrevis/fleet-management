const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function successError(fn) {
  return `import { NextRequest, NextResponse } from 'next/server';
import { ${fn}Service } from '../services/${fn}.service';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}`;
}

// ========== STOCK MODULE ==========
writeFile(`${BASE}/stock/validators/stock.validator.ts`, `import { z } from 'zod';

export const createStockSchema = z.object({
  partId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().nonnegative().default(0),
  reservedQuantity: z.number().int().nonnegative().default(0),
  availableQuantity: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
});

export const updateStockSchema = createStockSchema.partial().omit({ partId: true, warehouseId: true });

export const stockSearchSchema = z.object({
  partId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type StockSearchInput = z.infer<typeof stockSearchSchema>;
`);

writeFile(`${BASE}/stock/repositories/stock.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class StockRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.StockWhereInput; orderBy?: Prisma.StockOrderByWithRelationInput } = {}) {
    const [stocks, total] = await Promise.all([
      prisma.stock.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { part: { select: { id: true, name: true, partNumber: true, minimumStock: true } }, warehouse: { select: { id: true, name: true, code: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.stock.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { stocks, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.stock.findFirst({ where: { id, companyId, deletedAt: null }, include: { part: true, warehouse: true } });
  }

  async findByPartAndWarehouse(partId: string, warehouseId: string, companyId: string) {
    return prisma.stock.findFirst({ where: { partId, warehouseId, companyId, deletedAt: null } });
  }

  async create(data: Prisma.StockCreateInput) {
    return prisma.stock.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.StockUpdateInput) {
    return prisma.stock.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.stock.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const stockRepository = new StockRepository();
`);

writeFile(`${BASE}/stock/services/stock.service.ts`, `import { stockRepository } from '../repositories/stock.repository';
import { CreateStockInput, UpdateStockInput, StockSearchInput } from '../validators/stock.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class StockService {
  async getAll(companyId: string, search: StockSearchInput) {
    const where: any = { deletedAt: null };
    if (search.partId) where.partId = search.partId;
    if (search.warehouseId) where.warehouseId = search.warehouseId;
    if (search.lowStock) {
      where.AND = [
        { quantity: { lte: { part: { minimumStock: { gt: 0 } } } } },
        { quantity: { gt: 0 } }
      ];
    }
    return stockRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const stock = await stockRepository.findById(id, companyId);
    if (!stock) throw new NotFoundError('Stock record not found');
    return stock;
  }

  async create(companyId: string, data: CreateStockInput) {
    const existing = await stockRepository.findByPartAndWarehouse(data.partId, data.warehouseId, companyId);
    if (existing) throw new ConflictError('Stock record already exists for this part and warehouse');
    return stockRepository.create({ ...data, company: { connect: { id: companyId } }, part: { connect: { id: data.partId } }, warehouse: { connect: { id: data.warehouseId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateStockInput) {
    await this.getById(id, companyId);
    await stockRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return stockRepository.delete(id, companyId);
  }
}

export const stockService = new StockService();
`);

writeFile(`${BASE}/stock/controllers/stock.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { stockService } from '../services/stock.service';
import { createStockSchema, updateStockSchema, stockSearchSchema } from '../validators/stock.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class StockController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = stockSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await stockService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const stock = await stockService.getById(id, companyId); return successResponse(stock); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = createStockSchema.parse(body); const stock = await stockService.create(companyId, data); return successResponse(stock, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = updateStockSchema.parse(body); const stock = await stockService.update(id, companyId, data); return successResponse(stock); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await stockService.delete(id, companyId); return successResponse({ message: 'Stock deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const stockController = new StockController();
`);

// ========== SUPPLIER MODULE ==========
writeFile(`${BASE}/supplier/validators/supplier.validator.ts`, `import { z } from 'zod';
import { SupplierStatus } from '@prisma/client';

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  isPreferred: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierSearchSchema = z.object({
  q: z.string().optional(),
  isPreferred: z.coerce.boolean().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierSearchInput = z.infer<typeof supplierSearchSchema>;
`);

writeFile(`${BASE}/supplier/repositories/supplier.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SupplierRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.SupplierWhereInput; orderBy?: Prisma.SupplierOrderByWithRelationInput } = {}) {
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { name: 'asc' },
      }),
      prisma.supplier.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { suppliers, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.supplier.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.supplier.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const supplierRepository = new SupplierRepository();
`);

writeFile(`${BASE}/supplier/services/supplier.service.ts`, `import { supplierRepository } from '../repositories/supplier.repository';
import { CreateSupplierInput, UpdateSupplierInput, SupplierSearchInput } from '../validators/supplier.validator';
import { NotFoundError } from '@/shared/errors/AppError';

export class SupplierService {
  async getAll(companyId: string, search: SupplierSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.isPreferred !== undefined) where.isPreferred = search.isPreferred;
    if (search.status === 'active') where.isActive = true;
    if (search.status === 'inactive') where.isActive = false;
    return supplierRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const supplier = await supplierRepository.findById(id, companyId);
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async create(companyId: string, data: CreateSupplierInput) {
    return supplierRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateSupplierInput) {
    await this.getById(id, companyId);
    await supplierRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return supplierRepository.delete(id, companyId);
  }
}

export const supplierService = new SupplierService();
`);

writeFile(`${BASE}/supplier/controllers/supplier.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '../services/supplier.service';
import { createSupplierSchema, updateSupplierSchema, supplierSearchSchema } from '../validators/supplier.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class SupplierController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = supplierSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await supplierService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const supplier = await supplierService.getById(id, companyId); return successResponse(supplier); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = createSupplierSchema.parse(body); const supplier = await supplierService.create(companyId, data); return successResponse(supplier, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = updateSupplierSchema.parse(body); const supplier = await supplierService.update(id, companyId, data); return successResponse(supplier); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await supplierService.delete(id, companyId); return successResponse({ message: 'Supplier deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const supplierController = new SupplierController();
`);

// ========== TOOL MODULE ==========
writeFile(`${BASE}/tool/validators/tool.validator.ts`, `import { z } from 'zod';
import { ToolStatus, ToolCondition } from '@prisma/client';

export const createToolSchema = z.object({
  toolNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchasePrice: z.number().nonnegative().optional().nullable(),
  assignedMechanicId: z.string().uuid().optional().nullable(),
  lastCalibrationDate: z.string().datetime().optional().nullable(),
  nextCalibrationDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(ToolStatus).default(ToolStatus.AVAILABLE),
  condition: z.nativeEnum(ToolCondition).default(ToolCondition.EXCELLENT),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateToolSchema = createToolSchema.partial();

export const toolSearchSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(ToolStatus).optional(),
  mechanicId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
export type ToolSearchInput = z.infer<typeof toolSearchSchema>;
`);

writeFile(`${BASE}/tool/repositories/tool.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ToolRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.ToolWhereInput; orderBy?: Prisma.ToolOrderByWithRelationInput } = {}) {
    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { mechanic: { select: { id: true, firstName: true, lastName: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.tool.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { tools, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.tool.findFirst({ where: { id, companyId, deletedAt: null }, include: { mechanic: true } });
  }

  async findByToolNumber(toolNumber: string, companyId: string) {
    return prisma.tool.findFirst({ where: { toolNumber, companyId, deletedAt: null } });
  }

  async create(data: Prisma.ToolCreateInput) {
    return prisma.tool.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.ToolUpdateInput) {
    return prisma.tool.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.tool.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const toolRepository = new ToolRepository();
`);

writeFile(`${BASE}/tool/services/tool.service.ts`, `import { toolRepository } from '../repositories/tool.repository';
import { CreateToolInput, UpdateToolInput, ToolSearchInput } from '../validators/tool.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class ToolService {
  async getAll(companyId: string, search: ToolSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { toolNumber: { contains: search.q, mode: 'insensitive' } },
        { serialNumber: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status;
    if (search.mechanicId) where.assignedMechanicId = search.mechanicId;
    return toolRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const tool = await toolRepository.findById(id, companyId);
    if (!tool) throw new NotFoundError('Tool not found');
    return tool;
  }

  async create(companyId: string, data: CreateToolInput) {
    const existing = await toolRepository.findByToolNumber(data.toolNumber, companyId);
    if (existing) throw new ConflictError('Tool number already exists');
    return toolRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateToolInput) {
    await this.getById(id, companyId);
    if (data.toolNumber) {
      const existing = await toolRepository.findByToolNumber(data.toolNumber, companyId);
      if (existing && existing.id !== id) throw new ConflictError('Tool number already exists');
    }
    await toolRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return toolRepository.delete(id, companyId);
  }
}

export const toolService = new ToolService();
`);

writeFile(`${BASE}/tool/controllers/tool.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { toolService } from '../services/tool.service';
import { createToolSchema, updateToolSchema, toolSearchSchema } from '../validators/tool.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class ToolController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = toolSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await toolService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const tool = await toolService.getById(id, companyId); return successResponse(tool); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = createToolSchema.parse(body); const tool = await toolService.create(companyId, data); return successResponse(tool, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = updateToolSchema.parse(body); const tool = await toolService.update(id, companyId, data); return successResponse(tool); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await toolService.delete(id, companyId); return successResponse({ message: 'Tool deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const toolController = new ToolController();
`);

console.log('Stock, supplier, tool modules created');

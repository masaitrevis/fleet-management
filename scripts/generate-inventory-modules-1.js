const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// ========== PART-CATEGORY MODULE ==========
writeFile(`${BASE}/part-category/validators/part-category.validator.ts`, `import { z } from 'zod';

export const createPartCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updatePartCategorySchema = createPartCategorySchema.partial();

export const partCategorySearchSchema = z.object({
  q: z.string().optional(),
  parentId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreatePartCategoryInput = z.infer<typeof createPartCategorySchema>;
export type UpdatePartCategoryInput = z.infer<typeof updatePartCategorySchema>;
export type PartCategorySearchInput = z.infer<typeof partCategorySearchSchema>;
`);

writeFile(`${BASE}/part-category/repositories/part-category.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PartCategoryRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.PartCategoryWhereInput; orderBy?: Prisma.PartCategoryOrderByWithRelationInput } = {}) {
    const [categories, total] = await Promise.all([
      prisma.partCategory.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { parentCategory: { select: { id: true, name: true } }, subCategories: { where: { deletedAt: null }, select: { id: true, name: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { sortOrder: 'asc' },
      }),
      prisma.partCategory.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { categories, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.partCategory.findFirst({ where: { id, companyId, deletedAt: null }, include: { parentCategory: true, subCategories: { where: { deletedAt: null } } } });
  }

  async create(data: Prisma.PartCategoryCreateInput) {
    return prisma.partCategory.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.PartCategoryUpdateInput) {
    return prisma.partCategory.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.partCategory.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const partCategoryRepository = new PartCategoryRepository();
`);

writeFile(`${BASE}/part-category/services/part-category.service.ts`, `import { partCategoryRepository } from '../repositories/part-category.repository';
import { CreatePartCategoryInput, UpdatePartCategoryInput, PartCategorySearchInput } from '../validators/part-category.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';

export class PartCategoryService {
  async getAll(companyId: string, search: PartCategorySearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.parentId) where.parentId = search.parentId;
    return partCategoryRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const cat = await partCategoryRepository.findById(id, companyId);
    if (!cat) throw new NotFoundError('Category not found');
    return cat;
  }

  async create(companyId: string, data: CreatePartCategoryInput) {
    if (data.parentId) {
      const parent = await partCategoryRepository.findById(data.parentId, companyId);
      if (!parent) throw new NotFoundError('Parent category not found');
    }
    return partCategoryRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdatePartCategoryInput) {
    await this.getById(id, companyId);
    if (data.parentId && data.parentId === id) throw new BadRequestError('Category cannot be its own parent');
    await partCategoryRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return partCategoryRepository.delete(id, companyId);
  }
}

export const partCategoryService = new PartCategoryService();
`);

writeFile(`${BASE}/part-category/controllers/part-category.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { partCategoryService } from '../services/part-category.service';
import { createPartCategorySchema, updatePartCategorySchema, partCategorySearchSchema } from '../validators/part-category.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class PartCategoryController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = partCategorySearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await partCategoryService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const cat = await partCategoryService.getById(id, companyId); return successResponse(cat); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = createPartCategorySchema.parse(body); const cat = await partCategoryService.create(companyId, data); return successResponse(cat, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = updatePartCategorySchema.parse(body); const cat = await partCategoryService.update(id, companyId, data); return successResponse(cat); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await partCategoryService.delete(id, companyId); return successResponse({ message: 'Category deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const partCategoryController = new PartCategoryController();
`);

// ========== INVENTORY-PART MODULE ==========
writeFile(`${BASE}/inventory-part/validators/inventory-part.validator.ts`, `import { z } from 'zod';
import { PartStatus } from '@prisma/client';

export const createInventoryPartSchema = z.object({
  partNumber: z.string().min(1).max(50),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  compatibleVehicles: z.any().optional(),
  unitOfMeasure: z.string().default('piece'),
  unitPrice: z.number().nonnegative().default(0),
  purchasePrice: z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative().optional().nullable(),
  taxRate: z.number().nonnegative().default(0),
  warrantyPeriod: z.number().int().nonnegative().optional().nullable(),
  minimumStock: z.number().int().nonnegative().default(0),
  maximumStock: z.number().int().nonnegative().optional().nullable(),
  reorderLevel: z.number().int().nonnegative().default(0),
  safetyStock: z.number().int().nonnegative().default(0),
  isSerialized: z.boolean().default(false),
  isTrackable: z.boolean().default(true),
  status: z.nativeEnum(PartStatus).default(PartStatus.ACTIVE),
  imageUrl: z.string().optional().nullable(),
  datasheetUrl: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  dimensions: z.any().optional(),
});

export const updateInventoryPartSchema = createInventoryPartSchema.partial();

export const inventoryPartSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(PartStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateInventoryPartInput = z.infer<typeof createInventoryPartSchema>;
export type UpdateInventoryPartInput = z.infer<typeof updateInventoryPartSchema>;
export type InventoryPartSearchInput = z.infer<typeof inventoryPartSearchSchema>;
`);

writeFile(`${BASE}/inventory-part/repositories/inventory-part.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class InventoryPartRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.InventoryPartWhereInput; orderBy?: Prisma.InventoryPartOrderByWithRelationInput } = {}) {
    const [parts, total] = await Promise.all([
      prisma.inventoryPart.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { category: { select: { id: true, name: true } }, stocks: { where: { deletedAt: null }, include: { warehouse: { select: { id: true, name: true } } } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.inventoryPart.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { parts, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.inventoryPart.findFirst({ where: { id, companyId, deletedAt: null }, include: { category: true, stocks: { where: { deletedAt: null }, include: { warehouse: true } } } });
  }

  async findByPartNumber(partNumber: string, companyId: string) {
    return prisma.inventoryPart.findFirst({ where: { partNumber, companyId, deletedAt: null } });
  }

  async findByBarcode(barcode: string, companyId: string) {
    return prisma.inventoryPart.findFirst({ where: { barcode, companyId, deletedAt: null } });
  }

  async create(data: Prisma.InventoryPartCreateInput) {
    return prisma.inventoryPart.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.InventoryPartUpdateInput) {
    return prisma.inventoryPart.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.inventoryPart.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const inventoryPartRepository = new InventoryPartRepository();
`);

writeFile(`${BASE}/inventory-part/services/inventory-part.service.ts`, `import { inventoryPartRepository } from '../repositories/inventory-part.repository';
import { CreateInventoryPartInput, UpdateInventoryPartInput, InventoryPartSearchInput } from '../validators/inventory-part.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class InventoryPartService {
  async getAll(companyId: string, search: InventoryPartSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { partNumber: { contains: search.q, mode: 'insensitive' } },
        { barcode: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.categoryId) where.categoryId = search.categoryId;
    if (search.status) where.status = search.status;
    return inventoryPartRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy || 'createdAt']: search.sortOrder } as any,
    });
  }

  async getById(id: string, companyId: string) {
    const part = await inventoryPartRepository.findById(id, companyId);
    if (!part) throw new NotFoundError('Part not found');
    return part;
  }

  async create(companyId: string, data: CreateInventoryPartInput) {
    const existing = await inventoryPartRepository.findByPartNumber(data.partNumber, companyId);
    if (existing) throw new ConflictError('Part number already exists');
    return inventoryPartRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateInventoryPartInput) {
    await this.getById(id, companyId);
    if (data.partNumber) {
      const existing = await inventoryPartRepository.findByPartNumber(data.partNumber, companyId);
      if (existing && existing.id !== id) throw new ConflictError('Part number already exists');
    }
    await inventoryPartRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return inventoryPartRepository.delete(id, companyId);
  }
}

export const inventoryPartService = new InventoryPartService();
`);

writeFile(`${BASE}/inventory-part/controllers/inventory-part.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { inventoryPartService } from '../services/inventory-part.service';
import { createInventoryPartSchema, updateInventoryPartSchema, inventoryPartSearchSchema } from '../validators/inventory-part.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class InventoryPartController {
  async getAll(req: NextRequest, companyId: string) {
    try { const search = inventoryPartSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams)); const result = await inventoryPartService.getAll(companyId, search); return successResponse(result); }
    catch (error) { return errorResponse(error as Error); }
  }
  async getById(req: NextRequest, companyId: string, id: string) {
    try { const part = await inventoryPartService.getById(id, companyId); return successResponse(part); }
    catch (error) { return errorResponse(error as Error); }
  }
  async create(req: NextRequest, companyId: string) {
    try { const body = await req.json(); const data = createInventoryPartSchema.parse(body); const part = await inventoryPartService.create(companyId, data); return successResponse(part, 201); }
    catch (error) { return errorResponse(error as Error); }
  }
  async update(req: NextRequest, companyId: string, id: string) {
    try { const body = await req.json(); const data = updateInventoryPartSchema.parse(body); const part = await inventoryPartService.update(id, companyId, data); return successResponse(part); }
    catch (error) { return errorResponse(error as Error); }
  }
  async delete(req: NextRequest, companyId: string, id: string) {
    try { await inventoryPartService.delete(id, companyId); return successResponse({ message: 'Part deleted' }); }
    catch (error) { return errorResponse(error as Error); }
  }
}

export const inventoryPartController = new InventoryPartController();
`);

console.log('Part-category and inventory-part modules created');

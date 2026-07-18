const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// ========== WAREHOUSE MODULE ==========
writeFile(`${BASE}/warehouse/validators/warehouse.validator.ts`, `import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  capacity: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const warehouseSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type WarehouseSearchInput = z.infer<typeof warehouseSearchSchema>;
`);

writeFile(`${BASE}/warehouse/repositories/warehouse.repository.ts`, `import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class WarehouseRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.WarehouseWhereInput; orderBy?: Prisma.WarehouseOrderByWithRelationInput } = {}) {
    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { warehouses, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.warehouse.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findByCode(code: string, companyId: string) {
    return prisma.warehouse.findFirst({ where: { code, companyId, deletedAt: null } });
  }

  async create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.WarehouseUpdateInput) {
    return prisma.warehouse.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.warehouse.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const warehouseRepository = new WarehouseRepository();
`);

writeFile(`${BASE}/warehouse/services/warehouse.service.ts`, `import { warehouseRepository } from '../repositories/warehouse.repository';
import { CreateWarehouseInput, UpdateWarehouseInput, WarehouseSearchInput } from '../validators/warehouse.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';

export class WarehouseService {
  async getAll(companyId: string, search: WarehouseSearchInput) {
    const where: Prisma.WarehouseWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { code: { contains: search.q, mode: 'insensitive' } },
        { city: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status === 'active') where.isActive = true;
    if (search.status === 'inactive') where.isActive = false;

    return warehouseRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy || 'name']: search.sortOrder } as any,
    });
  }

  async getById(id: string, companyId: string) {
    const warehouse = await warehouseRepository.findById(id, companyId);
    if (!warehouse) throw new NotFoundError('Warehouse not found');
    return warehouse;
  }

  async create(companyId: string, data: CreateWarehouseInput) {
    const existing = await warehouseRepository.findByCode(data.code, companyId);
    if (existing) throw new ConflictError('Warehouse code already exists');
    return warehouseRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateWarehouseInput) {
    await this.getById(id, companyId);
    if (data.code) {
      const existing = await warehouseRepository.findByCode(data.code, companyId);
      if (existing && existing.id !== id) throw new ConflictError('Warehouse code already exists');
    }
    await warehouseRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return warehouseRepository.delete(id, companyId);
  }
}

export const warehouseService = new WarehouseService();
`);

writeFile(`${BASE}/warehouse/controllers/warehouse.controller.ts`, `import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '../services/warehouse.service';
import { createWarehouseSchema, updateWarehouseSchema, warehouseSearchSchema } from '../validators/warehouse.validator';
import { AppError } from '@/shared/errors/AppError';

function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
  }
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
}

export class WarehouseController {
  async getAll(req: NextRequest, companyId: string) {
    try {
      const search = warehouseSearchSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
      const result = await warehouseService.getAll(companyId, search);
      return successResponse(result);
    } catch (error) { return errorResponse(error as Error); }
  }

  async getById(req: NextRequest, companyId: string, id: string) {
    try {
      const warehouse = await warehouseService.getById(id, companyId);
      return successResponse(warehouse);
    } catch (error) { return errorResponse(error as Error); }
  }

  async create(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const data = createWarehouseSchema.parse(body);
      const warehouse = await warehouseService.create(companyId, data);
      return successResponse(warehouse, 201);
    } catch (error) { return errorResponse(error as Error); }
  }

  async update(req: NextRequest, companyId: string, id: string) {
    try {
      const body = await req.json();
      const data = updateWarehouseSchema.parse(body);
      const warehouse = await warehouseService.update(id, companyId, data);
      return successResponse(warehouse);
    } catch (error) { return errorResponse(error as Error); }
  }

  async delete(req: NextRequest, companyId: string, id: string) {
    try {
      await warehouseService.delete(id, companyId);
      return successResponse({ message: 'Warehouse deleted' });
    } catch (error) { return errorResponse(error as Error); }
  }
}

export const warehouseController = new WarehouseController();
`);

console.log('Warehouse module created');

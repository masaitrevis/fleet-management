import { warehouseRepository } from '../repositories/warehouse.repository';
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

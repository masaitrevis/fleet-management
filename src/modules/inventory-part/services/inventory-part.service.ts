import { inventoryPartRepository } from '../repositories/inventory-part.repository';
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

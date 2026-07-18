import { stockRepository } from '../repositories/stock.repository';
import { CreateStockInput, UpdateStockInput, StockSearchInput } from '../validators/stock.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class StockService {
  async getAll(companyId: string, search: StockSearchInput) {
    const where: any = { deletedAt: null };
    if (search.partId) where.partId = search.partId;
    if (search.warehouseId) where.warehouseId = search.warehouseId;
    if (search.lowStock) {
      // lowStock filtering handled at repository level or via separate endpoint
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

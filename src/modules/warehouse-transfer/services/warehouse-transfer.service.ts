import { warehouseTransferRepository } from '../repositories/warehouse-transfer.repository';
import { CreateWarehouseTransferInput, UpdateWarehouseTransferInput, WarehouseTransferSearchInput } from '../validators/warehouse-transfer.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';

export class WarehouseTransferService {
  async getAll(companyId: string, search: WarehouseTransferSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.transferNumber = { contains: search.q, mode: 'insensitive' };
    if (search.status) where.status = search.status;
    if (search.sourceWarehouseId) where.sourceWarehouseId = search.sourceWarehouseId;
    if (search.destinationWarehouseId) where.destinationWarehouseId = search.destinationWarehouseId;
    return warehouseTransferRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const transfer = await warehouseTransferRepository.findById(id, companyId);
    if (!transfer) throw new NotFoundError('Transfer not found');
    return transfer;
  }

  async create(companyId: string, data: CreateWarehouseTransferInput) {
    if (data.sourceWarehouseId === data.destinationWarehouseId) throw new BadRequestError('Source and destination warehouses must be different');
    const existing = await warehouseTransferRepository.findAll(companyId, { where: { transferNumber: data.transferNumber, deletedAt: null }, take: 1 });
    if (existing.total > 0) throw new ConflictError('Transfer number already exists');
    const { items, ...transferData } = data;
    return warehouseTransferRepository.create(
      { ...transferData, company: { connect: { id: companyId } }, sourceWarehouse: { connect: { id: data.sourceWarehouseId } }, destinationWarehouse: { connect: { id: data.destinationWarehouseId } } } as any,
      items.map(item => ({ ...item }))
    );
  }

  async update(id: string, companyId: string, data: UpdateWarehouseTransferInput) {
    await this.getById(id, companyId);
    if (data.sourceWarehouseId && data.destinationWarehouseId && data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new BadRequestError('Source and destination warehouses must be different');
    }
    const { items, ...transferData } = data;
    await warehouseTransferRepository.update(id, companyId, transferData as any);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return warehouseTransferRepository.delete(id, companyId);
  }
}

export const warehouseTransferService = new WarehouseTransferService();

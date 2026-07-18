import { purchaseOrderRepository } from '../repositories/purchase-order.repository';
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput, PurchaseOrderSearchInput } from '../validators/purchase-order.validator';
import { NotFoundError, ConflictError } from '@/shared/errors/AppError';

export class PurchaseOrderService {
  async getAll(companyId: string, search: PurchaseOrderSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.orderNumber = { contains: search.q, mode: 'insensitive' };
    if (search.status) where.status = search.status;
    if (search.supplierId) where.supplierId = search.supplierId;
    return purchaseOrderRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const order = await purchaseOrderRepository.findById(id, companyId);
    if (!order) throw new NotFoundError('Purchase order not found');
    return order;
  }

  async create(companyId: string, data: CreatePurchaseOrderInput) {
    const existing = await purchaseOrderRepository.findAll(companyId, { where: { orderNumber: data.orderNumber, deletedAt: null }, take: 1 });
    if (existing.total > 0) throw new ConflictError('Order number already exists');
    const { items, ...orderData } = data;
    return purchaseOrderRepository.create(
      { ...orderData, company: { connect: { id: companyId } } } as any,
      items.map(item => ({ ...item }))
    );
  }

  async update(id: string, companyId: string, data: UpdatePurchaseOrderInput) {
    await this.getById(id, companyId);
    const { items, ...orderData } = data;
    await purchaseOrderRepository.update(id, companyId, orderData as any);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return purchaseOrderRepository.delete(id, companyId);
  }
}

export const purchaseOrderService = new PurchaseOrderService();

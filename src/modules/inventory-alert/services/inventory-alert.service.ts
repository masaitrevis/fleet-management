import { inventoryAlertRepository } from '../repositories/inventory-alert.repository';
import { CreateInventoryAlertInput, InventoryAlertSearchInput } from '../validators/inventory-alert.validator';
import { NotFoundError } from '@/shared/errors/AppError';

export class InventoryAlertService {
  async getAll(companyId: string, search: InventoryAlertSearchInput) {
    const where: any = { deletedAt: null };
    if (search.alertType) where.alertType = search.alertType;
    if (search.isRead !== undefined) where.isRead = search.isRead;
    if (search.isResolved !== undefined) where.isResolved = search.isResolved;
    return inventoryAlertRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const alert = await inventoryAlertRepository.findById(id, companyId);
    if (!alert) throw new NotFoundError('Alert not found');
    return alert;
  }

  async create(companyId: string, data: CreateInventoryAlertInput) {
    return inventoryAlertRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async markAsRead(id: string, companyId: string) {
    await this.getById(id, companyId);
    await inventoryAlertRepository.update(id, companyId, { isRead: true });
    return this.getById(id, companyId);
  }

  async resolve(id: string, companyId: string) {
    await this.getById(id, companyId);
    await inventoryAlertRepository.update(id, companyId, { isResolved: true, isRead: true });
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return inventoryAlertRepository.delete(id, companyId);
  }

  async getUnreadCount(companyId: string) {
    return inventoryAlertRepository.countUnread(companyId);
  }
}

export const inventoryAlertService = new InventoryAlertService();

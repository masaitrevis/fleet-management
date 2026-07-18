import { deliveryQueueRepository } from '../repositories/delivery-queue.repository';

export class DeliveryQueueService {
  async getAll(companyId: string, search: any) { return deliveryQueueRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return deliveryQueueRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return deliveryQueueRepository.create(companyId, data); }
  async updateStatus(id: string, companyId: string, status: string, errorMessage?: string) { return deliveryQueueRepository.updateStatus(id, companyId, status, errorMessage); }
  async update(id: string, companyId: string, data: any) { return deliveryQueueRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return deliveryQueueRepository.delete(id, companyId); }
  async getPending(companyId: string, limit?: number) { return deliveryQueueRepository.getPending(companyId, limit); }
}

export const deliveryQueueService = new DeliveryQueueService();

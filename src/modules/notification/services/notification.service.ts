import { notificationRepository } from '../repositories/notification.repository';

export class NotificationService {
  async getAll(companyId: string, search: any) { return notificationRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return notificationRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return notificationRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return notificationRepository.update(id, companyId, data); }
  async markRead(id: string, companyId: string) { return notificationRepository.markRead(id, companyId); }
  async markReadAll(companyId: string, userId: string) { return notificationRepository.markReadAll(companyId, userId); }
  async archive(id: string, companyId: string) { return notificationRepository.archive(id, companyId); }
  async delete(id: string, companyId: string) { return notificationRepository.delete(id, companyId); }
  async getUnreadCount(companyId: string, userId: string) { return notificationRepository.getUnreadCount(companyId, userId); }
  async getStats(companyId: string) { return notificationRepository.getStats(companyId); }
}

export const notificationService = new NotificationService();

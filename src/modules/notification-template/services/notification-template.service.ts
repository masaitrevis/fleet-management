import { notificationTemplateRepository } from '../repositories/notification-template.repository';

export class NotificationTemplateService {
  async getAll(companyId: string, search: any) { return notificationTemplateRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return notificationTemplateRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return notificationTemplateRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return notificationTemplateRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return notificationTemplateRepository.delete(id, companyId); }
}

export const notificationTemplateService = new NotificationTemplateService();

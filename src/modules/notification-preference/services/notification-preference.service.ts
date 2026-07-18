import { notificationPreferenceRepository } from '../repositories/notification-preference.repository';

export class NotificationPreferenceService {
  async getAll(companyId: string, userId: string, search: any) { return notificationPreferenceRepository.findAll(companyId, userId, search); }
  async getById(id: string, companyId: string, userId: string) { return notificationPreferenceRepository.findById(id, companyId, userId); }
  async create(companyId: string, userId: string, data: any) { return notificationPreferenceRepository.create(companyId, userId, data); }
  async update(id: string, companyId: string, userId: string, data: any) { return notificationPreferenceRepository.update(id, companyId, userId, data); }
  async delete(id: string, companyId: string, userId: string) { return notificationPreferenceRepository.delete(id, companyId, userId); }
  async upsert(companyId: string, userId: string, data: any) { return notificationPreferenceRepository.upsert(companyId, userId, data); }
}

export const notificationPreferenceService = new NotificationPreferenceService();

import { maintenanceNotificationRepository } from '../repositories/maintenance-notification.repository';
import { NotFoundError } from '@/shared/errors/AppError';

export class MaintenanceNotificationService {
  async getAll(companyId: string, userId: string) {
    return maintenanceNotificationRepository.findAll(companyId, userId);
  }

  async markRead(id: string, companyId: string) {
    const result = await maintenanceNotificationRepository.markRead(id, companyId);
    if (result.count === 0) throw new NotFoundError('Notification not found');
    return { id, markedRead: true };
  }

  async getUnreadCount(companyId: string) {
    return maintenanceNotificationRepository.getUnreadCount(companyId);
  }
}

export const maintenanceNotificationService = new MaintenanceNotificationService();

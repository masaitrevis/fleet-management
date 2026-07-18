import { prisma } from '@/lib/prisma';

export class MaintenanceNotificationRepository {
  async findAll(companyId: string, userId: string) {
    return prisma.maintenanceNotification.findMany({
      where: { companyId, isRead: false },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, companyId: string) {
    return prisma.maintenanceNotification.updateMany({
      where: { id, companyId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(companyId: string) {
    return prisma.maintenanceNotification.count({
      where: { companyId, isRead: false },
    });
  }
}

export const maintenanceNotificationRepository = new MaintenanceNotificationRepository();

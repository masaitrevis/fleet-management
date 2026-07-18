import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class NotificationRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.NotificationWhereInput = { companyId, deletedAt: null };
    if (search.q) where.title = { contains: search.q, mode: 'insensitive' };
    if (search.type) where.type = search.type;
    if (search.status) where.status = search.status;
    if (search.priority) where.priority = search.priority;
    if (search.channel) where.channel = search.channel;
    if (search.userId) where.userId = search.userId;
    if (search.unread === 'true') where.status = { not: 'READ' };

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { deliveryLogs: true },
      }),
      prisma.notification.count({ where }),
    ]);
    return { notifications: data, total };
  }

  async findById(id: string, companyId: string) {
    const n = await prisma.notification.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { deliveryLogs: true },
    });
    if (!n) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    return n;
  }

  async create(companyId: string, data: any) {
    return prisma.notification.create({
      data: { ...data, companyId, status: 'PENDING' },
      include: { deliveryLogs: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.notification.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: { deliveryLogs: true },
    });
  }

  async markRead(id: string, companyId: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markReadAll(companyId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { companyId, userId, status: { not: 'READ' }, deletedAt: null },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async archive(id: string, companyId: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.notification.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getUnreadCount(companyId: string, userId: string) {
    return prisma.notification.count({
      where: { companyId, userId, status: { notIn: ['READ', 'ARCHIVED'] }, deletedAt: null },
    });
  }

  async getStats(companyId: string) {
    const [total, unread, pending, failed, today] = await Promise.all([
      prisma.notification.count({ where: { companyId, deletedAt: null } }),
      prisma.notification.count({ where: { companyId, status: { notIn: ['READ', 'ARCHIVED'] }, deletedAt: null } }),
      prisma.notification.count({ where: { companyId, status: 'PENDING', deletedAt: null } }),
      prisma.notification.count({ where: { companyId, status: 'FAILED', deletedAt: null } }),
      prisma.notification.count({ where: { companyId, deletedAt: null, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);
    return { total, unread, pending, failed, today };
  }
}

export const notificationRepository = new NotificationRepository();

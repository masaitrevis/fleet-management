import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class NotificationDeliveryLogRepository {
  async create(data: {
    notificationId: string;
    channel: string;
    status: string;
    provider?: string;
    providerResponse?: string;
    errorMessage?: string;
    deliveredAt?: Date;
  }) {
    return prisma.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        channel: data.channel as any,
        status: data.status as any,
        provider: data.provider,
        providerResponse: data.providerResponse,
        errorMessage: data.errorMessage,
        deliveredAt: data.deliveredAt,
      },
    });
  }

  async findByNotification(notificationId: string) {
    return prisma.notificationDeliveryLog.findMany({
      where: { notificationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(companyId: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await prisma.notificationDeliveryLog.findMany({
      where: {
        createdAt: { gte: since },
        notification: { companyId },
      },
    });

    const total = logs.length;
    const delivered = logs.filter((l) => l.status === 'DELIVERED').length;
    const failed = logs.filter((l) => l.status === 'FAILED').length;
    const byChannel = logs.reduce((acc, log) => {
      acc[log.channel] = (acc[log.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      delivered,
      failed,
      successRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      byChannel,
    };
  }
}

export const notificationDeliveryLogRepository = new NotificationDeliveryLogRepository();

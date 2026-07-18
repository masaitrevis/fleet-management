import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class NotificationPreferenceRepository {
  async findAll(companyId: string, userId: string, search: any) {
    const where: Prisma.NotificationPreferenceWhereInput = { companyId, userId };
    if (search.notificationType) where.notificationType = search.notificationType;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.notificationPreference.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationPreference.count({ where }),
    ]);
    return { preferences: data, total };
  }

  async findById(id: string, companyId: string, userId: string) {
    const p = await prisma.notificationPreference.findFirst({ where: { id, companyId, userId } });
    if (!p) throw new AppError('Preference not found', 404, 'PREFERENCE_NOT_FOUND');
    return p;
  }

  async create(companyId: string, userId: string, data: any) {
    return prisma.notificationPreference.create({
      data: { ...data, companyId, userId },
    });
  }

  async update(id: string, companyId: string, userId: string, data: any) {
    await this.findById(id, companyId, userId);
    return prisma.notificationPreference.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string, userId: string) {
    await this.findById(id, companyId, userId);
    return prisma.notificationPreference.delete({ where: { id } });
  }

  async upsert(companyId: string, userId: string, data: any) {
    return prisma.notificationPreference.upsert({
      where: {
        companyId_userId_notificationType: {
          companyId, userId, notificationType: data.notificationType,
        },
      },
      create: { ...data, companyId, userId },
      update: data,
    });
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();

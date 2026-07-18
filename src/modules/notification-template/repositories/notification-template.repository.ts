import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class NotificationTemplateRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.NotificationTemplateWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.templateType) where.templateType = search.templateType;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationTemplate.count({ where }),
    ]);
    return { templates: data, total };
  }

  async findById(id: string, companyId: string) {
    const t = await prisma.notificationTemplate.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!t) throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    return t;
  }

  async create(companyId: string, data: any) {
    return prisma.notificationTemplate.create({ data: { ...data, companyId } });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.notificationTemplate.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.notificationTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const notificationTemplateRepository = new NotificationTemplateRepository();

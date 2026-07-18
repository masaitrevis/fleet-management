import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

export class InspectionTemplateRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.InspectionTemplateWhereInput = { companyId, deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.inspectionType) where.inspectionType = search.inspectionType;
    if (search.isActive !== undefined) where.isActive = search.isActive === 'true';

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.inspectionTemplate.findMany({
        where, skip: (pageNum - 1) * limitNum as number, take: limitNum as number,
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inspectionTemplate.count({ where }),
    ]);
    return { templates: data, total };
  }

  async findById(id: string, companyId: string) {
    const template = await prisma.inspectionTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!template) throw new AppError('Inspection template not found', 404, 'TEMPLATE_NOT_FOUND');
    return template;
  }

  async create(companyId: string, data: any) {
    const { items, ...templateData } = data;
    return prisma.inspectionTemplate.create({
      data: { ...templateData, companyId, items: items ? { create: items } : undefined },
      include: { items: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    const { items, ...templateData } = data;
    return prisma.inspectionTemplate.update({
      where: { id },
      data: { ...templateData, items: items ? { deleteMany: {}, create: items } : undefined },
      include: { items: true },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.inspectionTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const inspectionTemplateRepository = new InspectionTemplateRepository();

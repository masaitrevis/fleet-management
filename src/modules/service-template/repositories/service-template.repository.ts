import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ServiceTemplateRepository {
  async findAll(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      where?: Prisma.ServiceTemplateWhereInput;
      orderBy?: Prisma.ServiceTemplateOrderByWithRelationInput;
    } = {}
  ) {
    const [templates, total] = await Promise.all([
      prisma.serviceTemplate.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { serviceTemplateItems: true },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.serviceTemplate.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { templates, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.serviceTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { serviceTemplateItems: true },
    });
  }

  async create(data: Prisma.ServiceTemplateCreateInput) {
    return prisma.serviceTemplate.create({ data });
  }

  async createItem(data: Prisma.ServiceTemplateItemCreateInput) {
    return prisma.serviceTemplateItem.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.ServiceTemplateUpdateInput) {
    return prisma.serviceTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.serviceTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  async deleteItems(templateId: string) {
    return prisma.serviceTemplateItem.deleteMany({
      where: { serviceTemplateId: templateId },
    });
  }
}

export const serviceTemplateRepository = new ServiceTemplateRepository();

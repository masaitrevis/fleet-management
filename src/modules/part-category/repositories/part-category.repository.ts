import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PartCategoryRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.PartCategoryWhereInput; orderBy?: Prisma.PartCategoryOrderByWithRelationInput } = {}) {
    const [categories, total] = await Promise.all([
      prisma.partCategory.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { parentCategory: { select: { id: true, name: true } }, subCategories: { where: { deletedAt: null }, select: { id: true, name: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { sortOrder: 'asc' },
      }),
      prisma.partCategory.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { categories, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.partCategory.findFirst({ where: { id, companyId, deletedAt: null }, include: { parentCategory: true, subCategories: { where: { deletedAt: null } } } });
  }

  async create(data: Prisma.PartCategoryCreateInput) {
    return prisma.partCategory.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.PartCategoryUpdateInput) {
    return prisma.partCategory.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.partCategory.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const partCategoryRepository = new PartCategoryRepository();

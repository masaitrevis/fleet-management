import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ToolRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.ToolWhereInput; orderBy?: Prisma.ToolOrderByWithRelationInput } = {}) {
    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: { mechanic: { select: { id: true, firstName: true, lastName: true } } },
        skip: options.skip, take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.tool.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { tools, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.tool.findFirst({ where: { id, companyId, deletedAt: null }, include: { mechanic: true } });
  }

  async findByToolNumber(toolNumber: string, companyId: string) {
    return prisma.tool.findFirst({ where: { toolNumber, companyId, deletedAt: null } });
  }

  async create(data: Prisma.ToolCreateInput) {
    return prisma.tool.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.ToolUpdateInput) {
    return prisma.tool.updateMany({ where: { id, companyId, deletedAt: null }, data });
  }

  async delete(id: string, companyId: string) {
    return prisma.tool.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }
}

export const toolRepository = new ToolRepository();

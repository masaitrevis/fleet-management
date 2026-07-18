import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class JobRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.JobRecordWhereInput;
    orderBy?: Prisma.JobRecordOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.jobRecord.findMany(params),
      prisma.jobRecord.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    return prisma.jobRecord.findUnique({ where: { id } });
  }

  async create(data: Prisma.JobRecordCreateInput) {
    return prisma.jobRecord.create({ data });
  }

  async update(id: string, data: Prisma.JobRecordUpdateInput) {
    return prisma.jobRecord.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.jobRecord.delete({ where: { id } });
  }
}

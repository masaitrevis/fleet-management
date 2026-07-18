import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FeatureFlagRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FeatureFlagWhereInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.featureFlag.findMany({
        ...params,
        include: { company: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.featureFlag.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    return prisma.featureFlag.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true, slug: true } } },
    });
  }

  async create(data: Prisma.FeatureFlagUncheckedCreateInput) {
    return prisma.featureFlag.create({ data } as any);
  }

  async update(id: string, data: Prisma.FeatureFlagUncheckedUpdateInput) {
    return prisma.featureFlag.update({ where: { id }, data } as any);
  }

  async delete(id: string) {
    return prisma.featureFlag.delete({ where: { id } });
  }
}

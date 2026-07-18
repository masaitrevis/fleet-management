import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SystemConfigRepository {
  async findAll(params?: { category?: string }) {
    const where: Prisma.PlatformConfigWhereInput = {};
    if (params?.category) where.category = params.category;
    return prisma.platformConfig.findMany({ where, orderBy: { category: 'asc', key: 'asc' } });
  }

  async findByKey(key: string) {
    return prisma.platformConfig.findUnique({ where: { key } });
  }

  async upsert(key: string, data: Prisma.PlatformConfigCreateInput) {
    return prisma.platformConfig.upsert({
      where: { key },
      create: data,
      update: { value: data.value, category: data.category, description: data.description, isEncrypted: data.isEncrypted },
    });
  }

  async delete(key: string) {
    return prisma.platformConfig.delete({ where: { key } });
  }
}

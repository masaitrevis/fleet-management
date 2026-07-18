import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PlatformUserRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PlatformUserWhereInput;
    orderBy?: Prisma.PlatformUserOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.platformUser.findMany(params),
      prisma.platformUser.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    return prisma.platformUser.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.platformUser.findUnique({ where: { email } });
  }

  async create(data: Prisma.PlatformUserCreateInput) {
    return prisma.platformUser.create({ data });
  }

  async update(id: string, data: Prisma.PlatformUserUpdateInput) {
    return prisma.platformUser.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.platformUser.delete({ where: { id } });
  }

  async incrementFailedAttempts(id: string) {
    return prisma.platformUser.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    });
  }

  async resetFailedAttempts(id: string) {
    return prisma.platformUser.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }
}

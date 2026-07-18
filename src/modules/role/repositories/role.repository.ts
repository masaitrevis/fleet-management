import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class RoleRepository {
  async findAll(companyId: string) {
    return prisma.role.findMany({
      where: {
        OR: [
          { companyId },
          { isSystem: true },
        ],
        deletedAt: null,
      },
      include: {
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.role.findFirst({
      where: {
        id,
        OR: [
          { companyId },
          { isSystem: true },
        ],
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async create(data: Prisma.RoleCreateInput) {
    return prisma.role.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.RoleUpdateInput) {
    return prisma.role.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.role.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });
  }
}

export const roleRepository = new RoleRepository();

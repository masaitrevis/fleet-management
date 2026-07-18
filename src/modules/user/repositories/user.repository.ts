import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class UserRepository {
  async findAll(companyId: string, options: { search?: string; branchId?: string; departmentId?: string; status?: string; page?: number; limit?: number } = {}) {
    const { search, branchId, departmentId, status, page = 1, limit = 50 } = options;

    const where: Prisma.UserWhereInput = {
      companyUsers: { some: { companyId } },
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status: status as any }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          companyUsers: {
            where: { companyId },
            include: {
              company: { select: { id: true, name: true } },
            },
          },
          userRoles: {
            where: { companyId },
            include: { role: { select: { id: true, name: true } } },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, companyId: string) {
    return prisma.user.findFirst({
      where: {
        id,
        companyUsers: { some: { companyId } },
        deletedAt: null,
      },
      include: {
        companyUsers: {
          where: { companyId },
          include: { company: { select: { id: true, name: true } } },
        },
        userRoles: {
          where: { companyId },
          include: { role: { select: { id: true, name: true, permissions: true } } },
        },
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  async updateRoles(userId: string, companyId: string, roleIds: string[]) {
    // Remove existing roles for this company
    await prisma.userRole.deleteMany({
      where: { userId, companyId },
    });

    // Add new roles
    const userRoles = roleIds.map(roleId => ({
      userId,
      roleId,
      companyId,
    }));

    await prisma.userRole.createMany({ data: userRoles });
  }

  async suspendUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
  }

  async activateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }
}

export const userRepository = new UserRepository();

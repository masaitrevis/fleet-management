import { prisma } from '@/lib/prisma';
import { UserStatus, CompanyStatus } from '@prisma/client';
import { UserWithCompany } from '../types/auth.types';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<UserWithCompany | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companyUsers: {
          include: {
            company: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    return user as UserWithCompany | null;
  }

  async findUserById(id: string): Promise<UserWithCompany | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        companyUsers: {
          include: {
            company: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    return user as UserWithCompany | null;
  }

  async createCompanyAndOwner(data: {
    companyName: string;
    companySlug: string;
    companyEmail: string;
    companyPhone?: string;
    companyAddress?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug: data.companySlug,
          email: data.companyEmail,
          phone: data.companyPhone,
          address: data.companyAddress,
          status: CompanyStatus.ACTIVE,
        },
      });

      // Create owner role with all permissions
      const ownerRole = await tx.role.create({
        data: {
          name: 'Company Owner',
          description: 'Full access to company resources',
          companyId: company.id,
          permissions: [
            'company:read', 'company:update', 'company:delete',
            'user:create', 'user:read', 'user:update', 'user:delete',
            'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
            'driver:create', 'driver:read', 'driver:update', 'driver:delete',
            'trip:create', 'trip:read', 'trip:update', 'trip:delete',
            'route:create', 'route:read', 'route:update', 'route:delete',
            'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete',
            'fuel:create', 'fuel:read', 'fuel:update', 'fuel:delete',
            'expense:create', 'expense:read', 'expense:update', 'expense:delete',
            'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete',
            'report:read',
            'settings:read', 'settings:update',
          ],
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          status: UserStatus.ACTIVE,
        },
      });

      // Link user to company
      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          isOwner: true,
        },
      });

      // Assign owner role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
          companyId: company.id,
        },
      });

      return { company, user };
    });
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
    companyId: string;
    roleId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          status: UserStatus.PENDING,
        },
      });

      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: data.companyId,
          isOwner: false,
        },
      });

      if (data.roleId) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: data.roleId,
            companyId: data.companyId,
          },
        });
      }

      return user;
    });
  }

  async updateUserLoginSuccess(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementFailedLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    });
  }

  async lockUserAccount(userId: string, lockUntil: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: lockUntil,
      },
    });
  }

  async verifyEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }

  async createSession(data: {
    userId: string;
    companyId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return prisma.session.create({
      data,
    });
  }

  async findSessionByTokenHash(token: string) {
    return prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });
  }

  async revokeSession(token: string) {
    return prisma.session.deleteMany({
      where: { token },
    });
  }

  async revokeAllUserSessions(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredSessions() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
  }

  async findCompanyBySlug(slug: string) {
    return prisma.company.findUnique({
      where: { slug },
    });
  }

  async findCompanyById(id: string) {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  async createAuditLog(data: {
    companyId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const auditData: any = {
      action: data.action,
      entityType: data.entityType,
    };
    if (data.companyId) auditData.companyId = data.companyId;
    if (data.userId) auditData.userId = data.userId;
    if (data.entityId) auditData.entityId = data.entityId;
    if (data.description) auditData.metadata = { description: data.description };
    if (data.ipAddress) auditData.ipAddress = data.ipAddress;
    if (data.userAgent) auditData.userAgent = data.userAgent;

    return prisma.auditLog.create({
      data: auditData,
    });
  }
}

export const authRepository = new AuthRepository();

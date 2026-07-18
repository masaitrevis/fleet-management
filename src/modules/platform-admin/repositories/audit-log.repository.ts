import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class AuditLogRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PlatformAuditLogWhereInput;
    orderBy?: Prisma.PlatformAuditLogOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.platformAuditLog.findMany(params),
      prisma.platformAuditLog.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async create(data: Prisma.PlatformAuditLogCreateInput) {
    return prisma.platformAuditLog.create({ data });
  }
}

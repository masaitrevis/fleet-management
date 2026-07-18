import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SecurityRepository {
  async findEvents(params: {
    skip?: number;
    take?: number;
    where?: Prisma.SecurityEventWhereInput;
    orderBy?: Prisma.SecurityEventOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.securityEvent.findMany(params),
      prisma.securityEvent.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async findEventById(id: string) {
    return prisma.securityEvent.findUnique({ where: { id } });
  }

  async createEvent(data: Prisma.SecurityEventCreateInput) {
    return prisma.securityEvent.create({ data });
  }

  async resolveEvent(id: string, resolvedBy: string) {
    return prisma.securityEvent.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedBy },
    });
  }

  async getDashboardStats() {
    const [totalEvents, unresolvedEvents, criticalEvents, failedLogins24h, rateLimitViolations24h] = await Promise.all([
      prisma.securityEvent.count(),
      prisma.securityEvent.count({ where: { resolvedAt: null } }),
      prisma.securityEvent.count({ where: { severity: 'CRITICAL', resolvedAt: null } }),
      prisma.failedLogin.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.rateLimitViolation.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);
    return { totalEvents, unresolvedEvents, criticalEvents, failedLogins24h, rateLimitViolations24h };
  }

  async getRecentEvents(limit = 10) {
    return prisma.securityEvent.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

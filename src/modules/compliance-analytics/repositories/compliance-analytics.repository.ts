import { prisma } from '@/lib/prisma';

export class ComplianceAnalyticsRepository {
  async overview(companyId: string) {
    const [totalRules, activeRules, totalIncidents, openIncidents, totalActions, pendingActions, overdueActions, totalChecks, failedChecks, expiringDocs, totalInspections, failedInspections] = await Promise.all([
      prisma.complianceRule.count({ where: { companyId, deletedAt: null } }),
      prisma.complianceRule.count({ where: { companyId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.incident.count({ where: { companyId, deletedAt: null } }),
      prisma.incident.count({ where: { companyId, deletedAt: null, status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      prisma.correctiveAction.count({ where: { companyId, deletedAt: null } }),
      prisma.correctiveAction.count({ where: { companyId, deletedAt: null, status: 'PENDING' } }),
      prisma.correctiveAction.count({ where: { companyId, deletedAt: null, status: 'PENDING', dueDate: { lt: new Date() } } }),
      prisma.complianceCheck.count({ where: { companyId, deletedAt: null } }),
      prisma.complianceCheck.count({ where: { companyId, deletedAt: null, status: 'FAIL' } }),
      prisma.vehicleDocument.count({ where: { companyId, deletedAt: null, expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.inspection.count({ where: { companyId, deletedAt: null } }),
      prisma.inspection.count({ where: { companyId, deletedAt: null, result: 'FAIL' } }),
    ]);
    return { totalRules, activeRules, totalIncidents, openIncidents, totalActions, pendingActions, overdueActions, totalChecks, failedChecks, expiringDocs, totalInspections, failedInspections };
  }

  async complianceScore(companyId: string) {
    const totalChecks = await prisma.complianceCheck.count({ where: { companyId, deletedAt: null } });
    const passedChecks = await prisma.complianceCheck.count({ where: { companyId, deletedAt: null, status: 'PASS' } });
    return totalChecks === 0 ? 100 : Math.round((passedChecks / totalChecks) * 100);
  }

  async incidentTrends(companyId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.incident.groupBy({
      by: ['incidentType'],
      where: { companyId, deletedAt: null, createdAt: { gte: startDate } },
      _count: { id: true },
    });
  }
}

export const complianceAnalyticsRepository = new ComplianceAnalyticsRepository();

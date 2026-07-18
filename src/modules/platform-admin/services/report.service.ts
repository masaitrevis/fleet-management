import { TenantRepository } from '../repositories/tenant.repository';

export class ReportService {
  private tenantRepo = new TenantRepository();

  async getUsageReport() {
    const { items, total } = await this.tenantRepo.findAll({
      take: 1000,
      where: { deletedAt: null },
    });

    return {
      totalTenants: total,
      activeTenants: items.filter((t: any) => t.status === 'ACTIVE').length,
      trialTenants: items.filter((t: any) => t.status === 'TRIAL').length,
      suspendedTenants: items.filter((t: any) => t.status === 'SUSPENDED').length,
      averageUsersPerTenant: total > 0 ? items.reduce((sum: number, t: any) => sum + (t._count?.companyUsers || 0), 0) / total : 0,
      averageVehiclesPerTenant: total > 0 ? items.reduce((sum: number, t: any) => sum + (t._count?.vehicles || 0), 0) / total : 0,
    };
  }

  async getRevenueReport() {
    return {
      totalRevenue: 0,
      monthlyRecurring: 0,
      annualRecurring: 0,
      trialToPaidRate: 0,
      churnRate: 0,
      averageRevenuePerUser: 0,
    };
  }

  async getSecurityReport() {
    return {
      totalEvents: 0,
      failedLogins24h: 0,
      rateLimitViolations24h: 0,
      blockedIPs: 0,
      criticalEvents: 0,
    };
  }
}

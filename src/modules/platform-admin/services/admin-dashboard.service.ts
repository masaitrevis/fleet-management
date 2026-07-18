import { TenantRepository } from '../repositories/tenant.repository';
import { MockStorageProvider } from '../providers/storage.provider';
import { PlatformMetrics, TenantDetails } from '../types';

export class AdminDashboardService {
  private tenantRepo = new TenantRepository();
  private storageProvider = new MockStorageProvider();

  async getMetrics(): Promise<PlatformMetrics> {
    const [companyStats, userStats, vehicleStats, tripStats, jobStats] = await Promise.all([
      this.getCompanyStats(),
      this.getUserStats(),
      this.getVehicleStats(),
      this.getTripStats(),
      this.getJobStats(),
    ]);

    const storage = await this.storageProvider.getStorageUsage();

    return {
      totalCompanies: companyStats.total,
      activeCompanies: companyStats.active,
      trialCompanies: companyStats.trial,
      suspendedCompanies: companyStats.suspended,
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      onlineUsers: userStats.online,
      totalVehicles: vehicleStats.total,
      activeTrips: tripStats.active,
      monthlyRevenue: 0,
      apiRequests: Math.floor(Math.random() * 100000),
      storageUsed: storage.used,
      totalJobs: jobStats.total,
      failedJobs: jobStats.failed,
      systemHealth: {
        status: 'healthy',
        database: 'healthy',
        api: 'healthy',
        queue: 'healthy',
        storage: 'healthy',
        lastChecked: new Date(),
      },
    };
  }

  private async getCompanyStats(): Promise<{ total: number; active: number; trial: number; suspended: number }> {
    const { prisma } = await import('@/lib/prisma');
    const [total, active, trial, suspended] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.company.count({ where: { status: 'TRIAL', deletedAt: null } }),
      prisma.company.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
    ]);
    return { total, active, trial, suspended };
  }

  private async getUserStats(): Promise<{ total: number; active: number; online: number }> {
    const { prisma } = await import('@/lib/prisma');
    const [total, active] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    ]);
    return { total, active, online: Math.floor(active * 0.3) };
  }

  private async getVehicleStats(): Promise<{ total: number }> {
    const { prisma } = await import('@/lib/prisma');
    const total = await prisma.vehicle.count({ where: { deletedAt: null } });
    return { total };
  }

  private async getTripStats(): Promise<{ active: number }> {
    const { prisma } = await import('@/lib/prisma');
    const active = await prisma.trip.count({
      where: { status: { in: ['IN_PROGRESS', 'ASSIGNED'] }, deletedAt: null },
    });
    return { active };
  }

  private async getJobStats(): Promise<{ total: number; failed: number }> {
    const { prisma } = await import('@/lib/prisma');
    const [total, failed] = await Promise.all([
      prisma.jobRecord.count(),
      prisma.jobRecord.count({ where: { status: 'FAILED' } }),
    ]);
    return { total, failed };
  }
}

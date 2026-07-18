import { SecurityRepository } from '../repositories/security.repository';
import { SecurityDashboardData } from '../types';

export class SecurityService {
  private repo = new SecurityRepository();

  async getDashboardData(): Promise<SecurityDashboardData> {
    const stats = await this.repo.getDashboardStats();
    const recentEvents = await this.repo.getRecentEvents(10);

    return {
      totalEvents: stats.totalEvents,
      unresolvedEvents: stats.unresolvedEvents,
      criticalEvents: stats.criticalEvents,
      failedLogins24h: stats.failedLogins24h,
      rateLimitViolations24h: stats.rateLimitViolations24h,
      blockedIPs: 0,
      recentEvents: recentEvents as any,
    };
  }

  async listEvents(params: { page: number; limit: number; severity?: string; type?: string }) {
    const where: any = {};
    if (params.severity) where.severity = params.severity;
    if (params.type) where.type = params.type;

    return this.repo.findEvents({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveEvent(id: string, resolvedBy: string) {
    return this.repo.resolveEvent(id, resolvedBy);
  }
}

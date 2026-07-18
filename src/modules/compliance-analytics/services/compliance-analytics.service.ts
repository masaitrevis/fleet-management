import { complianceAnalyticsRepository } from '../repositories/compliance-analytics.repository';

export class ComplianceAnalyticsService {
  async overview(companyId: string) { return complianceAnalyticsRepository.overview(companyId); }
  async complianceScore(companyId: string) { return complianceAnalyticsRepository.complianceScore(companyId); }
  async incidentTrends(companyId: string, days: number) { return complianceAnalyticsRepository.incidentTrends(companyId, days); }
}

export const complianceAnalyticsService = new ComplianceAnalyticsService();

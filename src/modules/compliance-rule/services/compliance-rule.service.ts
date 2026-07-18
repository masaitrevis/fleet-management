import { complianceRuleRepository } from '../repositories/compliance-rule.repository';

export class ComplianceRuleService {
  async getAll(companyId: string, search: any) {
    return complianceRuleRepository.findAll(companyId, search);
  }

  async getById(id: string, companyId: string) {
    return complianceRuleRepository.findById(id, companyId);
  }

  async create(companyId: string, data: any) {
    return complianceRuleRepository.create(companyId, data);
  }

  async update(id: string, companyId: string, data: any) {
    return complianceRuleRepository.update(id, companyId, data);
  }

  async delete(id: string, companyId: string) {
    return complianceRuleRepository.delete(id, companyId);
  }
}

export const complianceRuleService = new ComplianceRuleService();

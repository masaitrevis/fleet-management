import { inspectionTemplateRepository } from '../repositories/inspection-template.repository';

export class InspectionTemplateService {
  async getAll(companyId: string, search: any) { return inspectionTemplateRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return inspectionTemplateRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return inspectionTemplateRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return inspectionTemplateRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return inspectionTemplateRepository.delete(id, companyId); }
}

export const inspectionTemplateService = new InspectionTemplateService();

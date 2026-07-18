import { incidentRepository } from '../repositories/incident.repository';

export class IncidentService {
  async getAll(companyId: string, search: any) { return incidentRepository.findAll(companyId, search); }
  async getById(id: string, companyId: string) { return incidentRepository.findById(id, companyId); }
  async create(companyId: string, data: any) { return incidentRepository.create(companyId, data); }
  async update(id: string, companyId: string, data: any) { return incidentRepository.update(id, companyId, data); }
  async delete(id: string, companyId: string) { return incidentRepository.delete(id, companyId); }
}

export const incidentService = new IncidentService();

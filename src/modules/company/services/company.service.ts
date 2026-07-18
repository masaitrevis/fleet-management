import { companyRepository } from '../repositories/company.repository';
import { UpdateCompanyInput, CompanySettingsInput } from '../validators/company.validator';
import { NotFoundError, ForbiddenError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';

export class CompanyService {
  async getCompany(companyId: string, userCompanyId: string) {
    if (companyId !== userCompanyId) {
      throw new ForbiddenError('You can only access your own company');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  }

  async updateCompany(companyId: string, userCompanyId: string, data: UpdateCompanyInput) {
    if (companyId !== userCompanyId) {
      throw new ForbiddenError('You can only update your own company');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.address) updateData.address = data.address;
    if (data.city) updateData.city = data.city;
    if (data.state) updateData.state = data.state;
    if (data.country) updateData.country = data.country;
    if (data.postalCode) updateData.postalCode = data.postalCode;
    if (data.website) updateData.website = data.website;
    if (data.taxId) updateData.taxId = data.taxId;
    if (data.registrationNumber) updateData.registrationNumber = data.registrationNumber;
    if (data.industry) updateData.industry = data.industry;
    if (data.logo) updateData.logo = data.logo;

    const updated = await companyRepository.update(companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      action: 'COMPANY_UPDATED',
      entityType: 'Company',
      entityId: companyId,
      description: 'Company profile updated',
    });

    return updated;
  }

  async getSettings(companyId: string, userCompanyId: string) {
    if (companyId !== userCompanyId) {
      throw new ForbiddenError('You can only access your own company');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company.settings || {};
  }

  async updateSettings(companyId: string, userCompanyId: string, settings: CompanySettingsInput) {
    if (companyId !== userCompanyId) {
      throw new ForbiddenError('You can only update your own company');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const updated = await companyRepository.updateSettings(companyId, settings as Record<string, unknown>);

    await authRepository.createAuditLog({
      companyId,
      action: 'COMPANY_SETTINGS_UPDATED',
      entityType: 'Company',
      entityId: companyId,
      description: 'Company settings updated',
    });

    return updated;
  }
}

export const companyService = new CompanyService();

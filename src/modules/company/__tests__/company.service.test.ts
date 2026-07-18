import { describe, it, expect, beforeEach, vi } from 'vitest';
import { companyService } from '../services/company.service';
import { companyRepository } from '../repositories/company.repository';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { NotFoundError, ForbiddenError } from '@/shared/errors/AppError';

vi.mock('../repositories/company.repository');
vi.mock('@/modules/auth/repositories/auth.repository');

describe('CompanyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCompany', () => {
    it('should return company when user has access', async () => {
      const mockCompany = { id: 'comp-1', name: 'Test Co' };
      vi.mocked(companyRepository.findById).mockResolvedValue(mockCompany as any);

      const result = await companyService.getCompany('comp-1', 'comp-1');
      expect(result).toEqual(mockCompany);
    });

    it('should throw ForbiddenError when user accesses different company', async () => {
      await expect(companyService.getCompany('comp-1', 'comp-2')).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError when company does not exist', async () => {
      vi.mocked(companyRepository.findById).mockResolvedValue(null);
      await expect(companyService.getCompany('comp-1', 'comp-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateCompany', () => {
    it('should update company and log audit', async () => {
      const mockCompany = { id: 'comp-1', name: 'Old Name' };
      vi.mocked(companyRepository.findById).mockResolvedValue(mockCompany as any);
      vi.mocked(companyRepository.update).mockResolvedValue({ ...mockCompany, name: 'New Name' } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await companyService.updateCompany('comp-1', 'comp-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
      expect(authRepository.createAuditLog).toHaveBeenCalled();
    });
  });
});

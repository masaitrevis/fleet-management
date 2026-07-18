import { describe, it, expect, beforeEach, vi } from 'vitest';
import { driverService, driverDocumentService } from '../services/driver.service';
import { driverRepository, driverAssignmentRepository, driverDocumentRepository } from '../repositories/driver.repository';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';

vi.mock('../repositories/driver.repository');
vi.mock('@/modules/auth/repositories/auth.repository');

describe('DriverService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new driver when license is unique', async () => {
      vi.mocked(driverRepository.findByLicenseNumber).mockResolvedValue(null);
      vi.mocked(driverRepository.create).mockResolvedValue({ id: 'd-1', firstName: 'John', lastName: 'Doe' } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await driverService.create('comp-1', {
        firstName: 'John',
        lastName: 'Doe',
        phone: '0712345678',
        status: 'ACTIVE',
        licenses: [{ licenseNumber: 'DL123456' }],
      }, 'user-1');

      expect(result!.firstName).toBe('John');
      expect(authRepository.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'DRIVER_CREATED' }));
    });

    it('should throw ConflictError when license number already exists', async () => {
      vi.mocked(driverRepository.findByLicenseNumber).mockResolvedValue({ id: 'd-1' } as any);
      await expect(driverService.create('comp-1', { firstName: 'John', lastName: 'Doe', phone: '0712345678', status: 'ACTIVE', licenses: [{ licenseNumber: 'DL123456' }] }, 'user-1'))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('getById', () => {
    it('should return driver when found', async () => {
      vi.mocked(driverRepository.findById).mockResolvedValue({ id: 'd-1', firstName: 'John' } as any);
      const result = await driverService.getById('d-1', 'comp-1');
      expect(result.firstName).toBe('John');
    });

    it('should throw NotFoundError when driver not found', async () => {
      vi.mocked(driverRepository.findById).mockResolvedValue(null);
      await expect(driverService.getById('d-1', 'comp-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignVehicle', () => {
    it('should assign driver to vehicle when not already assigned', async () => {
      vi.mocked(driverRepository.findById).mockResolvedValue({ id: 'd-1', currentVehicles: [] } as any);
      vi.mocked(driverRepository.update).mockResolvedValue({ count: 1 } as any);
      vi.mocked(driverAssignmentRepository.create).mockResolvedValue({ id: 'a-1' } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await driverService.assignVehicle('d-1', 'comp-1', { vehicleId: 'v-1' }, 'user-1');
      expect(result.message).toBe('Driver assigned to vehicle successfully');
    });

    it('should throw BadRequestError when driver already assigned', async () => {
      vi.mocked(driverRepository.findById).mockResolvedValue({ id: 'd-1', currentVehicles: [{ id: 'v-1' }] } as any);
      await expect(driverService.assignVehicle('d-1', 'comp-1', { vehicleId: 'v-2' }, 'user-1'))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('unassignVehicle', () => {
    it('should throw when driver not currently assigned', async () => {
      vi.mocked(driverRepository.findById).mockResolvedValue({ id: 'd-1', currentVehicles: [] } as any);
      await expect(driverService.unassignVehicle('d-1', 'comp-1', 'user-1')).rejects.toThrow(BadRequestError);
    });
  });

  describe('delete', () => {
    it('should soft delete driver and log audit', async () => {
      vi.mocked(driverRepository.findById).mockResolvedValue({ id: 'd-1', firstName: 'John', lastName: 'Doe' } as any);
      vi.mocked(driverRepository.softDelete).mockResolvedValue({ count: 1 } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await driverService.delete('d-1', 'comp-1', 'user-1');
      expect(result.message).toBe('Driver deleted successfully');
    });
  });
});

describe('DriverDocumentService', () => {
  it('should create driver document and log audit', async () => {
    vi.mocked(driverRepository.findById).mockResolvedValue({ id: 'd-1' } as any);
    vi.mocked(driverDocumentRepository.create).mockResolvedValue({ id: 'doc-1', title: 'License' } as any);
    vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

    const result = await driverDocumentService.create('d-1', 'comp-1', {
      driverId: 'd-1',
      documentType: 'LICENSE',
      title: 'Driver License 2024',
      fileUrl: 'https://example.com/license.pdf',
    }, 'user-1');

    expect(result.title).toBe('Driver License 2024');
  });
});

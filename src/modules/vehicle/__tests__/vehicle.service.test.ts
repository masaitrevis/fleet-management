import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vehicleService, vehicleDocumentService, vehicleImageService } from '../services/vehicle.service';
import { vehicleRepository, vehicleAssignmentRepository, vehicleDocumentRepository, vehicleImageRepository, odometerRepository } from '../repositories/vehicle.repository';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';

vi.mock('../repositories/vehicle.repository');
vi.mock('@/modules/auth/repositories/auth.repository');

describe('VehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new vehicle when plate/vin is unique', async () => {
      vi.mocked(vehicleRepository.findByPlateOrVin).mockResolvedValue(null);
      vi.mocked(vehicleRepository.create).mockResolvedValue({ id: 'v-1', registrationNumber: 'ABC123' } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await vehicleService.create('comp-1', {
        registrationNumber: 'ABC123',
        make: 'Toyota',
        model: 'Hilux',
        status: 'ACTIVE',
        availability: 'AVAILABLE',
      }, 'user-1');

      expect(result.registrationNumber).toBe('ABC123');
      expect(authRepository.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'VEHICLE_CREATED' }));
    });

    it('should throw ConflictError when plate/vin already exists', async () => {
      vi.mocked(vehicleRepository.findByPlateOrVin).mockResolvedValue({ id: 'v-1' } as any);
      await expect(vehicleService.create('comp-1', { registrationNumber: 'ABC123', make: 'Toyota', model: 'Hilux', plateNumber: 'XYZ', status: 'ACTIVE', availability: 'AVAILABLE' }, 'user-1'))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('getById', () => {
    it('should return vehicle when found', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1', make: 'Toyota' } as any);
      const result = await vehicleService.getById('v-1', 'comp-1');
      expect(result.make).toBe('Toyota');
    });

    it('should throw NotFoundError when vehicle not found', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue(null);
      await expect(vehicleService.getById('v-1', 'comp-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignDriver', () => {
    it('should end current assignment and create new one', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1', currentDriverId: 'd-1' } as any);
      vi.mocked(vehicleAssignmentRepository.endCurrentAssignment).mockResolvedValue({ count: 1 } as any);
      vi.mocked(vehicleRepository.update).mockResolvedValue({ count: 1 } as any);
      vi.mocked(vehicleAssignmentRepository.create).mockResolvedValue({ id: 'a-1' } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await vehicleService.assignDriver('v-1', 'comp-1', { driverId: 'd-2' }, 'user-1');
      expect(result.message).toBe('Vehicle assigned successfully');
      expect(vehicleAssignmentRepository.endCurrentAssignment).toHaveBeenCalledWith('v-1');
    });
  });

  describe('unassignDriver', () => {
    it('should throw when vehicle not currently assigned', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1', currentDriverId: null } as any);
      await expect(vehicleService.unassignDriver('v-1', 'comp-1', 'user-1')).rejects.toThrow(BadRequestError);
    });
  });

  describe('addOdometer', () => {
    it('should update odometer when reading is valid', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1', odometer: 10000 } as any);
      vi.mocked(odometerRepository.create).mockResolvedValue({ id: 'o-1' } as any);
      vi.mocked(vehicleRepository.update).mockResolvedValue({ count: 1 } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await vehicleService.addOdometer('v-1', 'comp-1', { reading: 10500, source: 'MANUAL' }, 'user-1');
      expect(result.message).toBe('Odometer reading recorded');
    });

    it('should throw when reading is less than current', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1', odometer: 10000 } as any);
      await expect(vehicleService.addOdometer('v-1', 'comp-1', { reading: 9000, source: 'MANUAL' }, 'user-1'))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('delete', () => {
    it('should soft delete vehicle and log audit', async () => {
      vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1', registrationNumber: 'ABC' } as any);
      vi.mocked(vehicleRepository.softDelete).mockResolvedValue({ count: 1 } as any);
      vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

      const result = await vehicleService.delete('v-1', 'comp-1', 'user-1');
      expect(result.message).toBe('Vehicle deleted successfully');
    });
  });
});

describe('VehicleDocumentService', () => {
  it('should create document and log audit', async () => {
    vi.mocked(vehicleRepository.findById).mockResolvedValue({ id: 'v-1' } as any);
    vi.mocked(vehicleDocumentRepository.create).mockResolvedValue({ id: 'd-1', title: 'Insurance' } as any);
    vi.mocked(authRepository.createAuditLog).mockResolvedValue({} as any);

    const result = await vehicleDocumentService.create('v-1', 'comp-1', {
      vehicleId: 'v-1',
      type: 'INSURANCE',
      title: 'Insurance 2024',
      url: 'https://example.com/doc.pdf',
      reminderDays: 30,
    }, 'user-1');

    expect(result.title).toBe('Insurance 2024');
  });
});

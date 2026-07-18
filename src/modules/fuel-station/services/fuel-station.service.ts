import { fuelStationRepository } from '../repositories/fuel-station.repository';
import {
  CreateFuelStationInput,
  UpdateFuelStationInput,
  FuelStationSearchInput,
} from '../validators/fuel-station.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

export class FuelStationService {
  async getAll(companyId: string, search: FuelStationSearchInput) {
    const where: Prisma.FuelStationWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { brand: { contains: search.q, mode: 'insensitive' } },
        { address: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.city) where.city = { contains: search.city, mode: 'insensitive' };
    if (search.country) where.country = { contains: search.country, mode: 'insensitive' };

    const result = await fuelStationRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return {
      ...result,
      page: search.page,
      limit: search.limit,
      totalPages: Math.ceil(result.total / search.limit),
    };
  }

  async getById(id: string, companyId: string) {
    const station = await fuelStationRepository.findById(id, companyId);
    if (!station) throw new NotFoundError('Fuel station not found');
    return station;
  }

  async create(companyId: string, data: CreateFuelStationInput, createdById: string) {
    const station = await fuelStationRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    } as Prisma.FuelStationCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'FuelStation',
      entityId: station.id,
      description: `Fuel station ${data.name} created`,
    });

    return station;
  }

  async update(id: string, companyId: string, data: UpdateFuelStationInput, updatedById: string) {
    const station = await fuelStationRepository.findById(id, companyId);
    if (!station) throw new NotFoundError('Fuel station not found');

    await fuelStationRepository.update(id, companyId, data);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'FuelStation',
      entityId: id,
      description: `Fuel station ${station.name} updated`,
    });

    return fuelStationRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const station = await fuelStationRepository.findById(id, companyId);
    if (!station) throw new NotFoundError('Fuel station not found');

    await fuelStationRepository.delete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DELETE',
      entityType: 'FuelStation',
      entityId: id,
      description: `Fuel station ${station.name} deleted`,
    });

    return { message: 'Fuel station deleted' };
  }
}

export const fuelStationService = new FuelStationService();

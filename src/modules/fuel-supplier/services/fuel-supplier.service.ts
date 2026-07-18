import { fuelSupplierRepository } from '../repositories/fuel-supplier.repository';
import {
  CreateFuelSupplierInput,
  UpdateFuelSupplierInput,
  FuelSupplierSearchInput,
} from '../validators/fuel-supplier.validator';
import { NotFoundError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

export class FuelSupplierService {
  async getAll(companyId: string, search: FuelSupplierSearchInput) {
    const where: Prisma.FuelSupplierWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { name: { contains: search.q, mode: 'insensitive' } },
        { contactName: { contains: search.q, mode: 'insensitive' } },
        { email: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;

    const result = await fuelSupplierRepository.findAll(companyId, {
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
    const supplier = await fuelSupplierRepository.findById(id, companyId);
    if (!supplier) throw new NotFoundError('Fuel supplier not found');
    return supplier;
  }

  async create(companyId: string, data: CreateFuelSupplierInput, createdById: string) {
    const supplier = await fuelSupplierRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    } as Prisma.FuelSupplierCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'FuelSupplier',
      entityId: supplier.id,
      description: `Fuel supplier ${data.name} created`,
    });

    return supplier;
  }

  async update(id: string, companyId: string, data: UpdateFuelSupplierInput, updatedById: string) {
    const supplier = await fuelSupplierRepository.findById(id, companyId);
    if (!supplier) throw new NotFoundError('Fuel supplier not found');

    await fuelSupplierRepository.update(id, companyId, data);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'FuelSupplier',
      entityId: id,
      description: `Fuel supplier ${supplier.name} updated`,
    });

    return fuelSupplierRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const supplier = await fuelSupplierRepository.findById(id, companyId);
    if (!supplier) throw new NotFoundError('Fuel supplier not found');

    await fuelSupplierRepository.delete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DELETE',
      entityType: 'FuelSupplier',
      entityId: id,
      description: `Fuel supplier ${supplier.name} deleted`,
    });

    return { message: 'Fuel supplier deleted' };
  }
}

export const fuelSupplierService = new FuelSupplierService();

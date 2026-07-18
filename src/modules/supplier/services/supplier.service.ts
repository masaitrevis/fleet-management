import { supplierRepository } from '../repositories/supplier.repository';
import { CreateSupplierInput, UpdateSupplierInput, SupplierSearchInput } from '../validators/supplier.validator';
import { NotFoundError } from '@/shared/errors/AppError';

export class SupplierService {
  async getAll(companyId: string, search: SupplierSearchInput) {
    const where: any = { deletedAt: null };
    if (search.q) where.name = { contains: search.q, mode: 'insensitive' };
    if (search.isPreferred !== undefined) where.isPreferred = search.isPreferred;
    if (search.status === 'active') where.isActive = true;
    if (search.status === 'inactive') where.isActive = false;
    return supplierRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
    });
  }

  async getById(id: string, companyId: string) {
    const supplier = await supplierRepository.findById(id, companyId);
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async create(companyId: string, data: CreateSupplierInput) {
    return supplierRepository.create({ ...data, company: { connect: { id: companyId } } } as any);
  }

  async update(id: string, companyId: string, data: UpdateSupplierInput) {
    await this.getById(id, companyId);
    await supplierRepository.update(id, companyId, data);
    return this.getById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return supplierRepository.delete(id, companyId);
  }
}

export const supplierService = new SupplierService();

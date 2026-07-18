import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class VehicleRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.VehicleWhereInput; orderBy?: Prisma.VehicleOrderByWithRelationInput } = {}) {
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          companyId,
          deletedAt: null,
          ...options.where,
        },
        include: {
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          currentDriver: { select: { id: true, firstName: true, lastName: true, email: true } },
          fleetManager: { select: { id: true, firstName: true, lastName: true, email: true } },
          images: { select: { id: true, url: true, thumbnail: true, isPrimary: true } },
          vehicleDocuments: { where: { isActive: true }, select: { id: true, documentType: true, title: true, expiryDate: true } },
          _count: { select: { assignments: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.vehicle.count({
        where: { companyId, deletedAt: null, ...options.where },
      }),
    ]);
    return { vehicles, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.vehicle.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        branch: true,
        department: true,
        currentDriver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        fleetManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        images: { orderBy: { createdAt: 'desc' } },
        vehicleDocuments: { orderBy: { createdAt: 'desc' } },
        assignments: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        odometerReadings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async create(data: Prisma.VehicleCreateInput) {
    return prisma.vehicle.create({ data, include: { branch: true, currentDriver: true } });
  }

  async update(id: string, companyId: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.updateMany({ where: { id, companyId }, data });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.vehicle.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: 'OUT_OF_SERVICE', availability: 'OFFLINE' },
    });
  }

  async findByPlateOrVin(companyId: string, plateNumber?: string, vin?: string) {
    return prisma.vehicle.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          ...(plateNumber ? [{ plateNumber }] : []),
          ...(vin ? [{ vin }] : []),
        ],
      },
    });
  }

  async getFilterOptions(companyId: string) {
    const [makes, models, years, statuses, fuelTypes, categories] = await Promise.all([
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { make: true }, distinct: ['make'] }).then(r => r.map(v => v.make)),
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { model: true }, distinct: ['model'] }).then(r => r.map(v => v.model)),
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { year: true }, distinct: ['year'] }).then(r => r.map(v => v.year)),
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { status: true }, distinct: ['status'] }).then(r => r.map(v => v.status)),
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { fuelType: true }, distinct: ['fuelType'] }).then(r => r.map(v => v.fuelType)),
      prisma.vehicle.findMany({ where: { companyId, deletedAt: null }, select: { category: true }, distinct: ['category'] }).then(r => r.map(v => v.category)),
    ]);
    return { makes, models, years, statuses, fuelTypes, categories };
  }
}

export class VehicleAssignmentRepository {
  async create(data: Prisma.VehicleAssignmentCreateInput) {
    return prisma.vehicleAssignment.create({ data });
  }

  async endCurrentAssignment(vehicleId: string) {
    return prisma.vehicleAssignment.updateMany({
      where: { vehicleId, endedAt: null },
      data: { endedAt: new Date() },
    });
  }

  async findByVehicle(vehicleId: string) {
    return prisma.vehicleAssignment.findMany({
      where: { vehicleId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export class VehicleDocumentRepository {
  async findAll(vehicleId: string) {
    return prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, vehicleId: string) {
    return prisma.vehicleDocument.findFirst({ where: { id, vehicleId } });
  }

  async create(data: Prisma.VehicleDocumentCreateInput) {
    return prisma.vehicleDocument.create({ data });
  }

  async update(id: string, data: Prisma.VehicleDocumentUpdateInput) {
    return prisma.vehicleDocument.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.vehicleDocument.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  }
}

export class VehicleImageRepository {
  async findByVehicle(vehicleId: string) {
    return prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.VehicleImageCreateInput) {
    return prisma.vehicleImage.create({ data });
  }

  async delete(id: string) {
    return prisma.vehicleImage.delete({ where: { id } });
  }

  async setPrimary(vehicleId: string, imageId: string) {
    await prisma.vehicleImage.updateMany({
      where: { vehicleId },
      data: { isPrimary: false },
    });
    return prisma.vehicleImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }
}

export class OdometerRepository {
  async create(data: Prisma.OdometerReadingCreateInput) {
    return prisma.odometerReading.create({ data });
  }

  async findByVehicle(vehicleId: string) {
    return prisma.odometerReading.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export class VehicleCategoryRepository {
  async findAll(companyId: string) {
    return prisma.vehicleCategory.findMany({
      where: { OR: [{ companyId }, { isCustom: false }], isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.VehicleCategoryCreateInput) {
    return prisma.vehicleCategory.create({ data });
  }

  async delete(id: string, companyId: string) {
    return prisma.vehicleCategory.updateMany({
      where: { id, companyId },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}

export const vehicleRepository = new VehicleRepository();
export const vehicleAssignmentRepository = new VehicleAssignmentRepository();
export const vehicleDocumentRepository = new VehicleDocumentRepository();
export const vehicleImageRepository = new VehicleImageRepository();
export const odometerRepository = new OdometerRepository();
export const vehicleCategoryRepository = new VehicleCategoryRepository();

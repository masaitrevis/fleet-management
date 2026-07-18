import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class DriverRepository {
  async findAll(companyId: string, options: { skip?: number; take?: number; where?: Prisma.DriverWhereInput; orderBy?: Prisma.DriverOrderByWithRelationInput } = {}) {
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where: { companyId, deletedAt: null, ...options.where },
        include: {
          currentVehicles: { select: { id: true, registrationNumber: true, make: true, model: true } },
          licenses: { select: { id: true, licenseNumber: true, licenseClass: true, expiryDate: true } },
          _count: { select: { assignments: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' },
      }),
      prisma.driver.count({ where: { companyId, deletedAt: null, ...options.where } }),
    ]);
    return { drivers, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.driver.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        currentVehicles: true,
        licenses: { orderBy: { createdAt: 'desc' } },
        driverDocuments: { orderBy: { createdAt: 'desc' } },
        assignments: {
          include: {
            vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
          },
          orderBy: { assignedAt: 'desc' },
          take: 20,
        },
        driverCertifications: true,
        driverMedicalRecords: true,
      },
    });
  }

  async create(data: Prisma.DriverCreateInput) {
    return prisma.driver.create({ data, include: { currentVehicles: true } });
  }

  async update(id: string, companyId: string, data: Prisma.DriverUpdateInput) {
    return prisma.driver.updateMany({ where: { id, companyId }, data });
  }

  async softDelete(id: string, companyId: string) {
    return prisma.driver.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: 'TERMINATED' as any },
    });
  }

  async findByLicenseNumber(companyId: string, licenseNumber: string) {
    return prisma.driver.findFirst({
      where: {
        companyId,
        deletedAt: null,
        licenses: { some: { licenseNumber: { contains: licenseNumber, mode: 'insensitive' as any } } },
      },
    });
  }

  async getFilterOptions(companyId: string) {
    const [statuses, licenseClasses] = await Promise.all([
      prisma.driver.findMany({ where: { companyId, deletedAt: null }, select: { status: true }, distinct: ['status'] }).then(r => r.map(d => d.status)),
      prisma.driverLicense.findMany({ where: { driver: { companyId, deletedAt: null } }, select: { licenseClass: true }, distinct: ['licenseClass'] }).then(r => r.map(l => l.licenseClass)),
    ]);
    return { statuses, licenseClasses };
  }
}

export class DriverAssignmentRepository {
  async create(data: Prisma.VehicleAssignmentCreateInput) {
    return prisma.vehicleAssignment.create({ data });
  }

  async endCurrentAssignment(driverId: string) {
    return prisma.vehicleAssignment.updateMany({
      where: { driverId, endedAt: null },
      data: { endedAt: new Date() },
    });
  }

  async findByDriver(driverId: string) {
    return prisma.vehicleAssignment.findMany({
      where: { driverId },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }
}

export class DriverDocumentRepository {
  async findAll(driverId: string) {
    return prisma.driverDocument.findMany({ where: { driverId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, driverId: string) {
    return prisma.driverDocument.findFirst({ where: { id, driverId, deletedAt: null } });
  }

  async create(data: Prisma.DriverDocumentCreateInput) {
    return prisma.driverDocument.create({ data });
  }

  async update(id: string, data: Prisma.DriverDocumentUpdateInput) {
    return prisma.driverDocument.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.driverDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export class DriverLicenseRepository {
  async create(data: Prisma.DriverLicenseCreateInput) {
    return prisma.driverLicense.create({ data });
  }

  async update(id: string, data: Prisma.DriverLicenseUpdateInput) {
    return prisma.driverLicense.update({ where: { id }, data });
  }

  async deleteByDriver(driverId: string) {
    return prisma.driverLicense.deleteMany({ where: { driverId } });
  }

  async findByDriver(driverId: string) {
    return prisma.driverLicense.findMany({ where: { driverId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }
}

export const driverRepository = new DriverRepository();
export const driverAssignmentRepository = new DriverAssignmentRepository();
export const driverDocumentRepository = new DriverDocumentRepository();
export const driverLicenseRepository = new DriverLicenseRepository();

import {
  driverRepository,
  driverAssignmentRepository,
  driverDocumentRepository,
  driverLicenseRepository,
} from '../repositories/driver.repository';
import {
  CreateDriverInput,
  UpdateDriverInput,
  DriverSearchInput,
  DriverVehicleAssignmentInput,
  CreateDriverDocumentInput,
  UpdateDriverDocumentInput,
} from '../validators/driver.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

export class DriverService {
  async getAll(companyId: string, search: DriverSearchInput) {
    const where: Prisma.DriverWhereInput = {};
    if (search.q) {
      where.OR = [
        { firstName: { contains: search.q, mode: 'insensitive' } },
        { lastName: { contains: search.q, mode: 'insensitive' } },
        { email: { contains: search.q, mode: 'insensitive' } },
        { employeeId: { contains: search.q, mode: 'insensitive' } },
        { idNumber: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.licenseClass) {
      where.licenses = { some: { licenseClass: search.licenseClass as any } };
    }

    const result = await driverRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const driver = await driverRepository.findById(id, companyId);
    if (!driver) throw new NotFoundError('Driver not found');
    return driver;
  }

  async create(companyId: string, data: CreateDriverInput, createdById: string) {
    if (data.licenses?.length) {
      for (const lic of data.licenses) {
        const existing = await driverRepository.findByLicenseNumber(companyId, lic.licenseNumber);
        if (existing) throw new ConflictError('Driver with this license number already exists');
      }
    }

    const { licenses, ...driverData } = data;

    const driver = await driverRepository.create({
      ...driverData,
      company: { connect: { id: companyId } },
      ...(driverData.userId && { user: { connect: { id: driverData.userId } } }),
    } as Prisma.DriverCreateInput);

    if (licenses && licenses.length > 0) {
      for (const lic of licenses) {
        await driverLicenseRepository.create({
          driver: { connect: { id: driver.id } },
          licenseNumber: lic.licenseNumber,
          licenseClass: lic.licenseClass as any,
          licenseType: lic.licenseType as any,
          issueDate: lic.issueDate ? new Date(lic.issueDate) : undefined,
          expiryDate: lic.expiryDate ? new Date(lic.expiryDate) : undefined,
          issuingAuthority: lic.issuingAuthority,
          country: lic.country,
          state: lic.state,
          documentUrl: lic.documentUrl,
        } as Prisma.DriverLicenseCreateInput);
      }
    }

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'DRIVER_CREATED',
      entityType: 'Driver',
      entityId: driver.id,
      description: `Driver ${data.firstName} ${data.lastName} created`,
    });

    return driverRepository.findById(driver.id, companyId);
  }

  async update(id: string, companyId: string, data: UpdateDriverInput, updatedById: string) {
    const existing = await driverRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Driver not found');

    const updateData: Prisma.DriverUpdateInput = {};
    const simpleFields: (keyof UpdateDriverInput)[] = [
      'firstName', 'lastName', 'email', 'phone', 'phone2', 'employeeId',
      'dateOfBirth', 'hireDate', 'terminationDate', 'address', 'city',
      'state', 'country', 'postalCode', 'emergencyContact', 'emergencyPhone',
      'status', 'notes', 'gender', 'maritalStatus', 'nationality', 'idNumber',
      'photo',
    ];

    for (const field of simpleFields) {
      if (data[field] !== undefined) (updateData as any)[field] = data[field];
    }

    if (data.userId !== undefined) updateData.user = data.userId ? { connect: { id: data.userId } } : { disconnect: true };

    await driverRepository.update(id, companyId, updateData);

    // Handle license updates
    if (data.licenses !== undefined) {
      await driverLicenseRepository.deleteByDriver(id);
      if (data.licenses && data.licenses.length > 0) {
        for (const lic of data.licenses) {
          await driverLicenseRepository.create({
            driver: { connect: { id } },
            licenseNumber: lic.licenseNumber,
            licenseClass: lic.licenseClass as any,
            licenseType: lic.licenseType as any,
            issueDate: lic.issueDate ? new Date(lic.issueDate) : undefined,
            expiryDate: lic.expiryDate ? new Date(lic.expiryDate) : undefined,
            issuingAuthority: lic.issuingAuthority,
            country: lic.country,
            state: lic.state,
            documentUrl: lic.documentUrl,
          } as Prisma.DriverLicenseCreateInput);
        }
      }
    }

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'DRIVER_UPDATED',
      entityType: 'Driver',
      entityId: id,
      description: `Driver ${existing.firstName} ${existing.lastName} updated`,
    });

    return driverRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await driverRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Driver not found');

    await driverRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DRIVER_DELETED',
      entityType: 'Driver',
      entityId: id,
      description: `Driver ${existing.firstName} ${existing.lastName} deleted`,
    });

    return { message: 'Driver deleted successfully' };
  }

  async assignVehicle(id: string, companyId: string, data: DriverVehicleAssignmentInput, assignedById: string) {
    const driver = await driverRepository.findById(id, companyId);
    if (!driver) throw new NotFoundError('Driver not found');

    const hasCurrentVehicle = driver.currentVehicles && driver.currentVehicles.length > 0;
    if (hasCurrentVehicle) throw new BadRequestError('Driver already assigned to a vehicle');

    await driverAssignmentRepository.endCurrentAssignment(id);

    await driverAssignmentRepository.create({
      driver: { connect: { id } },
      vehicle: { connect: { id: data.vehicleId } },
      company: { connect: { id: companyId } },
      assignedBy: assignedById,
      notes: data.notes,
      isPrimary: true,
    } as any);

    await authRepository.createAuditLog({
      companyId,
      userId: assignedById,
      action: 'DRIVER_ASSIGNED',
      entityType: 'Driver',
      entityId: id,
      description: `Driver assigned to vehicle ${data.vehicleId}`,
    });

    return { message: 'Driver assigned to vehicle successfully' };
  }

  async unassignVehicle(id: string, companyId: string, unassignedById: string) {
    const driver = await driverRepository.findById(id, companyId);
    if (!driver) throw new NotFoundError('Driver not found');
    if (!driver.currentVehicles || driver.currentVehicles.length === 0) throw new BadRequestError('Driver is not currently assigned to a vehicle');

    await driverAssignmentRepository.endCurrentAssignment(id);

    await authRepository.createAuditLog({
      companyId,
      userId: unassignedById,
      action: 'DRIVER_UNASSIGNED',
      entityType: 'Driver',
      entityId: id,
      description: 'Driver unassigned from vehicle',
    });

    return { message: 'Driver unassigned successfully' };
  }

  async getFilters(companyId: string) {
    return driverRepository.getFilterOptions(companyId);
  }
}

export class DriverDocumentService {
  async getAll(driverId: string, companyId: string) {
    const driver = await driverRepository.findById(driverId, companyId);
    if (!driver) throw new NotFoundError('Driver not found');
    return driverDocumentRepository.findAll(driverId);
  }

  async create(driverId: string, companyId: string, data: CreateDriverDocumentInput, createdById: string) {
    const driver = await driverRepository.findById(driverId, companyId);
    if (!driver) throw new NotFoundError('Driver not found');

    const doc = await driverDocumentRepository.create({
      driver: { connect: { id: driverId } },
      company: { connect: { id: companyId } },
      documentType: data.documentType as any,
      title: data.title,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      notes: data.notes,
    } as Prisma.DriverDocumentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'DRIVER_DOCUMENT_CREATED',
      entityType: 'DriverDocument',
      entityId: doc.id,
      description: `${data.documentType} document added to driver`,
    });

    return doc;
  }

  async update(documentId: string, driverId: string, companyId: string, data: UpdateDriverDocumentInput, updatedById: string) {
    const driver = await driverRepository.findById(driverId, companyId);
    if (!driver) throw new NotFoundError('Driver not found');
    const doc = await driverDocumentRepository.findById(documentId, driverId);
    if (!doc) throw new NotFoundError('Document not found');

    const updateData: Prisma.DriverDocumentUpdateInput = {};
    if (data.documentType) updateData.documentType = data.documentType as any;
    if (data.title) updateData.title = data.title;
    if (data.fileUrl) updateData.fileUrl = data.fileUrl;
    if (data.fileName) updateData.fileName = data.fileName;
    if (data.fileSize) updateData.fileSize = data.fileSize;
    if (data.mimeType) updateData.mimeType = data.mimeType;
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

    const updated = await driverDocumentRepository.update(documentId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'DRIVER_DOCUMENT_UPDATED',
      entityType: 'DriverDocument',
      entityId: documentId,
      description: 'Driver document updated',
    });

    return updated;
  }

  async delete(documentId: string, driverId: string, companyId: string, deletedById: string) {
    const driver = await driverRepository.findById(driverId, companyId);
    if (!driver) throw new NotFoundError('Driver not found');
    const doc = await driverDocumentRepository.findById(documentId, driverId);
    if (!doc) throw new NotFoundError('Document not found');

    await driverDocumentRepository.delete(documentId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DRIVER_DOCUMENT_DELETED',
      entityType: 'DriverDocument',
      entityId: documentId,
      description: 'Driver document deleted',
    });

    return { message: 'Document deleted successfully' };
  }
}

export const driverService = new DriverService();
export const driverDocumentService = new DriverDocumentService();

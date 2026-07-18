import {
  vehicleRepository,
  vehicleAssignmentRepository,
  vehicleDocumentRepository,
  vehicleImageRepository,
  odometerRepository,
  vehicleCategoryRepository,
} from '../repositories/vehicle.repository';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchInput,
  VehicleAssignmentInput,
  OdometerInput,
  CreateVehicleDocumentInput,
  UpdateVehicleDocumentInput,
  CreateVehicleCategoryInput,
} from '../validators/vehicle.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

export class VehicleService {
  async getAll(companyId: string, search: VehicleSearchInput) {
    const where: Prisma.VehicleWhereInput = {};
    if (search.q) {
      where.OR = [
        { make: { contains: search.q, mode: 'insensitive' } },
        { model: { contains: search.q, mode: 'insensitive' } },
        { registrationNumber: { contains: search.q, mode: 'insensitive' } },
        { plateNumber: { contains: search.q, mode: 'insensitive' } },
        { vin: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.category) where.category = search.category as any;
    if (search.make) where.make = { contains: search.make, mode: 'insensitive' };
    if (search.model) where.model = { contains: search.model, mode: 'insensitive' };
    if (search.fuelType) where.fuelType = search.fuelType as any;
    if (search.branchId) where.branchId = search.branchId;
    if (search.departmentId) where.departmentId = search.departmentId;
    if (search.yearFrom || search.yearTo) {
      where.year = {};
      if (search.yearFrom) (where.year as any).gte = search.yearFrom;
      if (search.yearTo) (where.year as any).lte = search.yearTo;
    }
    if (search.assignedDriverId) where.currentDriverId = search.assignedDriverId;
    if (search.availability) where.availability = search.availability as any;

    const result = await vehicleRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder },
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const vehicle = await vehicleRepository.findById(id, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async create(companyId: string, data: CreateVehicleInput, createdById: string) {
    const existing = await vehicleRepository.findByPlateOrVin(companyId, data.plateNumber, data.vin);
    if (existing) throw new ConflictError('Vehicle with this plate or VIN already exists');

    const vehicle = await vehicleRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      ...(data.branchId && { branch: { connect: { id: data.branchId } } }),
      ...(data.departmentId && { department: { connect: { id: data.departmentId } } }),
      ...(data.fleetManagerId && { fleetManager: { connect: { id: data.fleetManagerId } } }),
      ...(data.currentDriverId && { currentDriver: { connect: { id: data.currentDriverId } } }),
    } as Prisma.VehicleCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'VEHICLE_CREATED',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      description: `Vehicle ${data.registrationNumber} created`,
    });

    return vehicle;
  }

  async update(id: string, companyId: string, data: UpdateVehicleInput, updatedById: string) {
    const existing = await vehicleRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Vehicle not found');

    const updateData: Prisma.VehicleUpdateInput = {};
    const simpleFields = [
      'registrationNumber', 'plateNumber', 'vin', 'chassisNumber', 'engineNumber',
      'make', 'model', 'trim', 'year', 'purchaseDate', 'purchasePrice', 'currentValue',
      'status', 'availability', 'color', 'category', 'fuelType', 'transmission',
      'engineCapacity', 'horsepower', 'torque', 'seatingCapacity', 'payloadCapacity',
      'grossWeight', 'axles', 'tyreSize', 'fuelTankCapacity', 'odometer', 'engineHours',
    ] as const;

    for (const field of simpleFields) {
      if (data[field] !== undefined) (updateData as any)[field] = data[field];
    }

    if (data.branchId !== undefined) updateData.branch = data.branchId ? { connect: { id: data.branchId } } : { disconnect: true };
    if (data.departmentId !== undefined) updateData.department = data.departmentId ? { connect: { id: data.departmentId } } : { disconnect: true };
    if (data.fleetManagerId !== undefined) updateData.fleetManager = data.fleetManagerId ? { connect: { id: data.fleetManagerId } } : { disconnect: true };
    if (data.currentDriverId !== undefined) updateData.currentDriver = data.currentDriverId ? { connect: { id: data.currentDriverId } } : { disconnect: true };

    await vehicleRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'VEHICLE_UPDATED',
      entityType: 'Vehicle',
      entityId: id,
      description: `Vehicle ${existing.registrationNumber} updated`,
    });

    return vehicleRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await vehicleRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Vehicle not found');

    await vehicleRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'VEHICLE_DELETED',
      entityType: 'Vehicle',
      entityId: id,
      description: `Vehicle ${existing.registrationNumber} deleted`,
    });

    return { message: 'Vehicle deleted successfully' };
  }

  async assignDriver(id: string, companyId: string, data: VehicleAssignmentInput, assignedById: string) {
    const vehicle = await vehicleRepository.findById(id, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.currentDriverId) {
      await vehicleAssignmentRepository.endCurrentAssignment(id);
    }

    await vehicleRepository.update(id, companyId, {
      currentDriver: { connect: { id: data.driverId } },
      availability: 'ASSIGNED',
    });

    await vehicleAssignmentRepository.create({
      vehicle: { connect: { id } },
      driver: { connect: { id: data.driverId } },
      companyId: companyId,
      assignedBy: assignedById,
      ...(data.branchId && { branch: { connect: { id: data.branchId } } }),
      ...(data.departmentId && { department: { connect: { id: data.departmentId } } }),
      notes: data.notes,
    } as Prisma.VehicleAssignmentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: assignedById,
      action: 'VEHICLE_ASSIGNED',
      entityType: 'Vehicle',
      entityId: id,
      description: `Vehicle assigned to driver ${data.driverId}`,
    });

    return { message: 'Vehicle assigned successfully' };
  }

  async unassignDriver(id: string, companyId: string, unassignedById: string) {
    const vehicle = await vehicleRepository.findById(id, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (!vehicle.currentDriverId) throw new BadRequestError('Vehicle is not currently assigned');

    await vehicleAssignmentRepository.endCurrentAssignment(id);
    await vehicleRepository.update(id, companyId, {
      currentDriver: { disconnect: true },
      availability: 'AVAILABLE',
    });

    await authRepository.createAuditLog({
      companyId,
      userId: unassignedById,
      action: 'VEHICLE_UNASSIGNED',
      entityType: 'Vehicle',
      entityId: id,
      description: `Vehicle unassigned from driver`,
    });

    return { message: 'Vehicle unassigned successfully' };
  }

  async addOdometer(id: string, companyId: string, data: OdometerInput, createdById: string) {
    const vehicle = await vehicleRepository.findById(id, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (data.reading < (vehicle.odometer || 0)) throw new BadRequestError('Odometer reading cannot be less than current reading');

    await odometerRepository.create({
      vehicle: { connect: { id } },
      company: { connect: { id: companyId } },
      reading: data.reading,
      source: data.source,
      notes: data.notes,
    } as Prisma.OdometerReadingCreateInput);

    await vehicleRepository.update(id, companyId, { odometer: data.reading });

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'ODOMETER_UPDATED',
      entityType: 'Vehicle',
      entityId: id,
      description: `Odometer updated to ${data.reading} km`,
    });

    return { message: 'Odometer reading recorded' };
  }

  async getFilters(companyId: string) {
    return vehicleRepository.getFilterOptions(companyId);
  }
}

export class VehicleDocumentService {
  async getAll(vehicleId: string, companyId: string) {
    const vehicle = await vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicleDocumentRepository.findAll(vehicleId);
  }

  async create(vehicleId: string, companyId: string, data: CreateVehicleDocumentInput, createdById: string) {
    const vehicle = await vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const doc = await vehicleDocumentRepository.create({
      vehicle: { connect: { id: vehicleId } },
      company: { connect: { id: companyId } },
      documentType: data.type,
      title: data.title,
      fileUrl: data.url,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : undefined,
      reminderDays: data.reminderDays,
    } as Prisma.VehicleDocumentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'VEHICLE_DOCUMENT_CREATED',
      entityType: 'VehicleDocument',
      entityId: doc.id,
      description: `${data.type} document added to vehicle`,
    });

    return doc;
  }

  async update(documentId: string, vehicleId: string, companyId: string, data: UpdateVehicleDocumentInput, updatedById: string) {
    const vehicle = await vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    const doc = await vehicleDocumentRepository.findById(documentId, vehicleId);
    if (!doc) throw new NotFoundError('Document not found');

    const updateData: Prisma.VehicleDocumentUpdateInput = {};
    if (data.type) updateData.documentType = data.type;
    if (data.title) updateData.title = data.title;
    if (data.url) updateData.fileUrl = data.url;
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
    if (data.renewalDate) updateData.renewalDate = new Date(data.renewalDate);
    if (data.reminderDays !== undefined) updateData.reminderDays = data.reminderDays;

    const updated = await vehicleDocumentRepository.update(documentId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'VEHICLE_DOCUMENT_UPDATED',
      entityType: 'VehicleDocument',
      entityId: documentId,
      description: 'Vehicle document updated',
    });

    return updated;
  }

  async delete(documentId: string, vehicleId: string, companyId: string, deletedById: string) {
    const vehicle = await vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    const doc = await vehicleDocumentRepository.findById(documentId, vehicleId);
    if (!doc) throw new NotFoundError('Document not found');

    await vehicleDocumentRepository.delete(documentId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'VEHICLE_DOCUMENT_DELETED',
      entityType: 'VehicleDocument',
      entityId: documentId,
      description: 'Vehicle document deleted',
    });

    return { message: 'Document deleted successfully' };
  }
}

export class VehicleImageService {
  async upload(vehicleId: string, companyId: string, imageUrl: string, thumbnailUrl: string, isPrimary: boolean, uploadedById: string) {
    const vehicle = await vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (isPrimary) {
      await vehicleImageRepository.setPrimary(vehicleId, 'temp'); // Reset all
    }

    const image = await vehicleImageRepository.create({
      vehicle: { connect: { id: vehicleId } },
      company: { connect: { id: companyId } },
      url: imageUrl,
      thumbnail: thumbnailUrl,
      isPrimary,
    } as Prisma.VehicleImageCreateInput);

    if (isPrimary) {
      await vehicleImageRepository.setPrimary(vehicleId, image.id);
    }

    await authRepository.createAuditLog({
      companyId,
      userId: uploadedById,
      action: 'VEHICLE_IMAGE_UPLOADED',
      entityType: 'Vehicle',
      entityId: vehicleId,
      description: 'Vehicle image uploaded',
    });

    return image;
  }

  async delete(imageId: string, vehicleId: string, companyId: string, deletedById: string) {
    const vehicle = await vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    await vehicleImageRepository.delete(imageId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'VEHICLE_IMAGE_DELETED',
      entityType: 'Vehicle',
      entityId: vehicleId,
      description: 'Vehicle image deleted',
    });

    return { message: 'Image deleted successfully' };
  }
}

export class VehicleCategoryService {
  async getAll(companyId: string) {
    return vehicleCategoryRepository.findAll(companyId);
  }

  async create(companyId: string, data: CreateVehicleCategoryInput, createdById: string) {
    const category = await vehicleCategoryRepository.create({
      ...data,
      company: { connect: { id: companyId } },
    } as Prisma.VehicleCategoryCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'VEHICLE_CATEGORY_CREATED',
      entityType: 'VehicleCategory',
      entityId: category.id,
      description: `Category ${data.name} created`,
    });

    return category;
  }

  async delete(id: string, companyId: string, deletedById: string) {
    await vehicleCategoryRepository.delete(id, companyId);
    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'VEHICLE_CATEGORY_DELETED',
      entityType: 'VehicleCategory',
      entityId: id,
      description: 'Vehicle category deleted',
    });
    return { message: 'Category deleted successfully' };
  }
}

export const vehicleService = new VehicleService();
export const vehicleDocumentService = new VehicleDocumentService();
export const vehicleImageService = new VehicleImageService();
export const vehicleCategoryService = new VehicleCategoryService();

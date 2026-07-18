import { assignmentRepository, assignmentSearchRepository } from '../repositories/assignment.repository';
import { vehicleRepository } from '@/modules/vehicle/repositories/vehicle.repository';
import { driverRepository } from '@/modules/driver/repositories/driver.repository';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { prisma } from '@/lib/prisma';
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentSearchInput,
  SwapDriverInput,
  SwapVehicleInput,
  TransferAssignmentInput,
  HistoryQueryInput,
} from '../validators/assignment.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';
import { Prisma } from '@prisma/client';

const BAD_DRIVER_STATUSES = ['SUSPENDED', 'TERMINATED', 'ON_LEAVE'];
const BAD_VEHICLE_STATUSES = ['IN_MAINTENANCE', 'OUT_OF_SERVICE', 'SOLD', 'SCRAPPED', 'STOLEN'];

export class AssignmentService {
  async getAll(companyId: string, search: AssignmentSearchInput) {
    const where: Prisma.VehicleAssignmentWhereInput = {};
    if (search.q) {
      where.OR = [
        { vehicle: { registrationNumber: { contains: search.q, mode: 'insensitive' } } },
        { driver: { firstName: { contains: search.q, mode: 'insensitive' } } },
        { driver: { lastName: { contains: search.q, mode: 'insensitive' } } },
        { driver: { employeeId: { contains: search.q, mode: 'insensitive' } } },
      ];
    }
    if (search.assignmentType) where.assignmentType = search.assignmentType as any;
    if (search.branchId) where.branchId = search.branchId;
    if (search.departmentId) where.departmentId = search.departmentId;

    const result = await assignmentRepository.findAll(companyId, {
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
    const assignment = await assignmentRepository.findById(id, companyId);
    if (!assignment) throw new NotFoundError('Assignment not found');
    return assignment;
  }

  async create(companyId: string, data: CreateAssignmentInput, assignedById: string) {
    // Validate driver exists and is eligible
    const driver = await driverRepository.findById(data.driverId, companyId);
    if (!driver) throw new NotFoundError('Driver not found');
    if (BAD_DRIVER_STATUSES.includes(driver.status)) {
      throw new BadRequestError(`Cannot assign driver with status ${driver.status}`);
    }

    // Check driver license expiry
    const now = new Date();
    if (driver.licenses && driver.licenses.length > 0) {
      const latestLicense = driver.licenses[0];
      if (latestLicense.expiryDate && new Date(latestLicense.expiryDate) < now) {
        throw new BadRequestError('Driver license has expired');
      }
    }

    // Validate vehicle exists and is eligible
    const vehicle = await vehicleRepository.findById(data.vehicleId, companyId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (BAD_VEHICLE_STATUSES.includes(vehicle.status)) {
      throw new BadRequestError(`Cannot assign vehicle with status ${vehicle.status}`);
    }

    // Check vehicle inspection expiry (if inspection model exists)
    try {
      const latestInspection = await (prisma as any).inspection?.findFirst?.({
        where: { vehicleId: data.vehicleId, companyId },
        orderBy: { inspectionDate: 'desc' },
      });
      if (latestInspection?.nextInspectionDate && new Date(latestInspection.nextInspectionDate) < now) {
        throw new BadRequestError('Vehicle inspection has expired');
      }
    } catch {
      // Inspection model may not exist or be accessible, skip
    }

    // Check for existing active assignment on this driver
    const existingDriverAssignment = await assignmentRepository.findActiveByDriver(data.driverId, companyId);
    if (existingDriverAssignment && existingDriverAssignment.id !== data.driverId) {
      throw new ConflictError('Driver is already assigned to another vehicle');
    }

    // Check for existing active assignment on this vehicle
    const existingVehicleAssignment = await assignmentRepository.findActiveByVehicle(data.vehicleId, companyId);
    if (existingVehicleAssignment) {
      throw new ConflictError('Vehicle is already assigned to another driver');
    }

    // If isPrimary, end any other active assignments for this driver (shouldn't happen due to above check, but belt-and-suspenders)
    if (data.isPrimary) {
      await assignmentRepository.endAllAssignmentsForDriver(data.driverId, companyId, assignedById);
    }

    const assignment = await assignmentRepository.create({
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      driver: { connect: { id: data.driverId } },
      ...(data.branchId && { branch: { connect: { id: data.branchId } } }),
      ...(data.departmentId && { department: { connect: { id: data.departmentId } } }),
      assignmentType: data.assignmentType as any,
      assignedBy: assignedById,
      notes: data.notes,
      isPrimary: data.isPrimary ?? true,
    } as unknown as Prisma.VehicleAssignmentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: assignedById,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'VehicleAssignment',
      entityId: assignment.id,
      description: `Assigned driver ${driver.firstName} ${driver.lastName} to vehicle ${vehicle.registrationNumber}`,
    });

    return assignment;
  }

  async update(id: string, companyId: string, data: UpdateAssignmentInput, updatedById: string) {
    const existing = await assignmentRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Assignment not found');
    if (existing.endedAt) throw new BadRequestError('Cannot update an ended assignment');

    const updateData: Prisma.VehicleAssignmentUpdateInput = {};
    if (data.branchId !== undefined) updateData.branch = data.branchId ? { connect: { id: data.branchId } } : { disconnect: true };
    if (data.departmentId !== undefined) updateData.department = data.departmentId ? { connect: { id: data.departmentId } } : { disconnect: true };
    if (data.assignmentType) updateData.assignmentType = data.assignmentType as any;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;

    await assignmentRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'ASSIGNMENT_UPDATED',
      entityType: 'VehicleAssignment',
      entityId: id,
      description: `Updated assignment ${id}`,
    });

    return assignmentRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await assignmentRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Assignment not found');

    await assignmentRepository.delete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'ASSIGNMENT_DELETED',
      entityType: 'VehicleAssignment',
      entityId: id,
      description: `Deleted assignment ${id}`,
    });

    return { message: 'Assignment deleted successfully' };
  }

  async endAssignment(id: string, companyId: string, endedById: string) {
    const existing = await assignmentRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Assignment not found');
    if (existing.endedAt) throw new BadRequestError('Assignment is already ended');

    await assignmentRepository.endAssignment(id, companyId, endedById);

    await authRepository.createAuditLog({
      companyId,
      userId: endedById,
      action: 'ASSIGNMENT_ENDED',
      entityType: 'VehicleAssignment',
      entityId: id,
      description: `Ended assignment ${id}`,
    });

    return { message: 'Assignment ended successfully' };
  }

  async swapDriver(companyId: string, data: SwapDriverInput, performedById: string) {
    const assignment = await assignmentRepository.findById(data.assignmentId, companyId);
    if (!assignment) throw new NotFoundError('Assignment not found');
    if (assignment.endedAt) throw new BadRequestError('Cannot swap on an ended assignment');

    // Validate new driver
    const newDriver = await driverRepository.findById(data.newDriverId, companyId);
    if (!newDriver) throw new NotFoundError('New driver not found');
    if (BAD_DRIVER_STATUSES.includes(newDriver.status)) {
      throw new BadRequestError(`Cannot assign driver with status ${newDriver.status}`);
    }

    const now = new Date();
    if (newDriver.licenses && newDriver.licenses.length > 0) {
      const latestLicense = newDriver.licenses[0];
      if (latestLicense.expiryDate && new Date(latestLicense.expiryDate) < now) {
        throw new BadRequestError('New driver license has expired');
      }
    }

    // Check if new driver already has an active assignment
    const existingDriverAssignment = await assignmentRepository.findActiveByDriver(data.newDriverId, companyId);
    if (existingDriverAssignment) {
      throw new ConflictError('New driver is already assigned to another vehicle');
    }

    // End current assignment
    await assignmentRepository.endAssignment(data.assignmentId, companyId, performedById);

    // Create new assignment with swapped driver
    const newAssignment = await assignmentRepository.create({
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: assignment.vehicleId } },
      driver: { connect: { id: data.newDriverId } },
      branch: assignment.branchId ? { connect: { id: assignment.branchId } } : undefined,
      department: assignment.departmentId ? { connect: { id: assignment.departmentId } } : undefined,
      assignmentType: assignment.assignmentType as any,
      assignedBy: performedById,
      notes: data.notes || `Swapped driver from ${assignment.driver?.firstName} ${assignment.driver?.lastName} to ${newDriver.firstName} ${newDriver.lastName}`,
      isPrimary: assignment.isPrimary,
    } as unknown as Prisma.VehicleAssignmentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: performedById,
      action: 'ASSIGNMENT_DRIVER_SWAPPED',
      entityType: 'VehicleAssignment',
      entityId: newAssignment.id,
      description: `Swapped driver on assignment ${data.assignmentId}: ${assignment.driver?.firstName} ${assignment.driver?.lastName} -> ${newDriver.firstName} ${newDriver.lastName}`,
    });

    return newAssignment;
  }

  async swapVehicle(companyId: string, data: SwapVehicleInput, performedById: string) {
    const assignment = await assignmentRepository.findById(data.assignmentId, companyId);
    if (!assignment) throw new NotFoundError('Assignment not found');
    if (assignment.endedAt) throw new BadRequestError('Cannot swap on an ended assignment');

    // Validate new vehicle
    const newVehicle = await vehicleRepository.findById(data.newVehicleId, companyId);
    if (!newVehicle) throw new NotFoundError('New vehicle not found');
    if (BAD_VEHICLE_STATUSES.includes(newVehicle.status)) {
      throw new BadRequestError(`Cannot assign vehicle with status ${newVehicle.status}`);
    }

    // Check if new vehicle already has an active assignment
    const existingVehicleAssignment = await assignmentRepository.findActiveByVehicle(data.newVehicleId, companyId);
    if (existingVehicleAssignment) {
      throw new ConflictError('New vehicle is already assigned to another driver');
    }

    // Check inspection expiry
    try {
      const latestInspection = await (prisma as any).inspection?.findFirst?.({
        where: { vehicleId: data.newVehicleId, companyId },
        orderBy: { inspectionDate: 'desc' },
      });
      if (latestInspection?.nextInspectionDate && new Date(latestInspection.nextInspectionDate) < new Date()) {
        throw new BadRequestError('New vehicle inspection has expired');
      }
    } catch {
      // skip
    }

    // End current assignment
    await assignmentRepository.endAssignment(data.assignmentId, companyId, performedById);

    // Create new assignment with swapped vehicle
    const newAssignment = await assignmentRepository.create({
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.newVehicleId } },
      driver: { connect: { id: assignment.driverId } },
      branch: assignment.branchId ? { connect: { id: assignment.branchId } } : undefined,
      department: assignment.departmentId ? { connect: { id: assignment.departmentId } } : undefined,
      assignmentType: assignment.assignmentType as any,
      assignedBy: performedById,
      notes: data.notes || `Swapped vehicle from ${assignment.vehicle?.registrationNumber} to ${newVehicle.registrationNumber}`,
      isPrimary: assignment.isPrimary,
    } as unknown as Prisma.VehicleAssignmentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: performedById,
      action: 'ASSIGNMENT_VEHICLE_SWAPPED',
      entityType: 'VehicleAssignment',
      entityId: newAssignment.id,
      description: `Swapped vehicle on assignment ${data.assignmentId}: ${assignment.vehicle?.registrationNumber} -> ${newVehicle.registrationNumber}`,
    });

    return newAssignment;
  }

  async transfer(companyId: string, data: TransferAssignmentInput, performedById: string) {
    const assignment = await assignmentRepository.findById(data.assignmentId, companyId);
    if (!assignment) throw new NotFoundError('Assignment not found');
    if (assignment.endedAt) throw new BadRequestError('Cannot transfer an ended assignment');

    let newDriverId = assignment.driverId;
    let newVehicleId = assignment.vehicleId;

    // Validate new driver if provided
    if (data.newDriverId && data.newDriverId !== assignment.driverId) {
      const newDriver = await driverRepository.findById(data.newDriverId, companyId);
      if (!newDriver) throw new NotFoundError('New driver not found');
      if (BAD_DRIVER_STATUSES.includes(newDriver.status)) {
        throw new BadRequestError(`Cannot assign driver with status ${newDriver.status}`);
      }
      const now = new Date();
      if (newDriver.licenses && newDriver.licenses.length > 0) {
        const latestLicense = newDriver.licenses[0];
        if (latestLicense.expiryDate && new Date(latestLicense.expiryDate) < now) {
          throw new BadRequestError('New driver license has expired');
        }
      }
      const existingDriverAssignment = await assignmentRepository.findActiveByDriver(data.newDriverId, companyId);
      if (existingDriverAssignment) {
        throw new ConflictError('New driver is already assigned to another vehicle');
      }
      newDriverId = data.newDriverId;
    }

    // Validate new vehicle if provided
    if (data.newVehicleId && data.newVehicleId !== assignment.vehicleId) {
      const newVehicle = await vehicleRepository.findById(data.newVehicleId, companyId);
      if (!newVehicle) throw new NotFoundError('New vehicle not found');
      if (BAD_VEHICLE_STATUSES.includes(newVehicle.status)) {
        throw new BadRequestError(`Cannot assign vehicle with status ${newVehicle.status}`);
      }
      const existingVehicleAssignment = await assignmentRepository.findActiveByVehicle(data.newVehicleId, companyId);
      if (existingVehicleAssignment) {
        throw new ConflictError('New vehicle is already assigned to another driver');
      }
      try {
        const latestInspection = await (prisma as any).inspection?.findFirst?.({
          where: { vehicleId: data.newVehicleId, companyId },
          orderBy: { inspectionDate: 'desc' },
        });
        if (latestInspection?.nextInspectionDate && new Date(latestInspection.nextInspectionDate) < new Date()) {
          throw new BadRequestError('New vehicle inspection has expired');
        }
      } catch {
        // skip
      }
      newVehicleId = data.newVehicleId;
    }

    // End current assignment
    await assignmentRepository.endAssignment(data.assignmentId, companyId, performedById);

    // Create new assignment with transferred details
    const newAssignment = await assignmentRepository.create({
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: newVehicleId } },
      driver: { connect: { id: newDriverId } },
      branch: data.branchId ? { connect: { id: data.branchId } } : assignment.branchId ? { connect: { id: assignment.branchId } } : undefined,
      department: data.departmentId ? { connect: { id: data.departmentId } } : assignment.departmentId ? { connect: { id: assignment.departmentId } } : undefined,
      assignmentType: assignment.assignmentType as any,
      assignedBy: performedById,
      notes: data.notes || `Transferred assignment from ${assignment.id}`,
      isPrimary: assignment.isPrimary,
    } as unknown as Prisma.VehicleAssignmentCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: performedById,
      action: 'ASSIGNMENT_TRANSFERRED',
      entityType: 'VehicleAssignment',
      entityId: newAssignment.id,
      description: `Transferred assignment ${data.assignmentId}`,
    });

    return newAssignment;
  }

  async getHistory(companyId: string, query: HistoryQueryInput) {
    return assignmentRepository.findHistory(companyId, {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      driverId: query.driverId,
      vehicleId: query.vehicleId,
    });
  }

  async getFilters(companyId: string) {
    return assignmentSearchRepository.getFilterOptions(companyId);
  }
}

export const assignmentService = new AssignmentService();

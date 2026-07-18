import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class AssignmentRepository {
  async findAll(companyId: string, options: {
    skip?: number;
    take?: number;
    where?: Prisma.VehicleAssignmentWhereInput;
    orderBy?: Prisma.VehicleAssignmentOrderByWithRelationInput;
  } = {}) {
    const [assignments, total] = await Promise.all([
      prisma.vehicleAssignment.findMany({
        where: {
          companyId,
          endedAt: null,
          ...options.where,
        },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
              status: true,
              availability: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              employeeId: true,
            },
          },
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { assignedAt: 'desc' },
      }),
      prisma.vehicleAssignment.count({
        where: {
          companyId,
          endedAt: null,
          ...options.where,
        },
      }),
    ]);
    return { assignments, total };
  }

  async findById(id: string, companyId: string) {
    return prisma.vehicleAssignment.findFirst({
      where: { id, companyId },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            status: true,
            availability: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            employeeId: true,
          },
        },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async create(data: Prisma.VehicleAssignmentCreateInput) {
    return prisma.vehicleAssignment.create({
      data,
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, companyId: string, data: Prisma.VehicleAssignmentUpdateInput) {
    return prisma.vehicleAssignment.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.vehicleAssignment.deleteMany({
      where: { id, companyId },
    });
  }

  async endAssignment(id: string, companyId: string, endedBy?: string) {
    return prisma.vehicleAssignment.updateMany({
      where: { id, companyId },
      data: {
        endedAt: new Date(),
        endedBy: endedBy || undefined,
        isPrimary: false,
      },
    });
  }

  async findActiveByDriver(driverId: string, companyId: string) {
    return prisma.vehicleAssignment.findFirst({
      where: {
        driverId,
        companyId,
        endedAt: null,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },
      },
    });
  }

  async findActiveByVehicle(vehicleId: string, companyId: string) {
    return prisma.vehicleAssignment.findFirst({
      where: {
        vehicleId,
        companyId,
        endedAt: null,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findHistory(companyId: string, options: {
    skip?: number;
    take?: number;
    driverId?: string;
    vehicleId?: string;
  } = {}) {
    const where: Prisma.VehicleAssignmentWhereInput = {
      companyId,
      endedAt: { not: null },
    };
    if (options.driverId) where.driverId = options.driverId;
    if (options.vehicleId) where.vehicleId = options.vehicleId;

    const [assignments, total] = await Promise.all([
      prisma.vehicleAssignment.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: { endedAt: 'desc' },
      }),
      prisma.vehicleAssignment.count({ where }),
    ]);
    return { assignments, total };
  }

  async endAllAssignmentsForVehicle(vehicleId: string, companyId: string, endedBy?: string) {
    return prisma.vehicleAssignment.updateMany({
      where: {
        vehicleId,
        companyId,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
        endedBy: endedBy || undefined,
        isPrimary: false,
      },
    });
  }

  async endAllAssignmentsForDriver(driverId: string, companyId: string, endedBy?: string) {
    return prisma.vehicleAssignment.updateMany({
      where: {
        driverId,
        companyId,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
        endedBy: endedBy || undefined,
        isPrimary: false,
      },
    });
  }

  async findAllIncludingEnded(companyId: string, options: {
    skip?: number;
    take?: number;
    where?: Prisma.VehicleAssignmentWhereInput;
  } = {}) {
    const [assignments, total] = await Promise.all([
      prisma.vehicleAssignment.findMany({
        where: { companyId, ...options.where },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
              status: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        skip: options.skip,
        take: options.take,
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.vehicleAssignment.count({ where: { companyId, ...options.where } }),
    ]);
    return { assignments, total };
  }
}

export class AssignmentSearchRepository {
  async getFilterOptions(companyId: string) {
    const [assignmentTypes, branches, departments] = await Promise.all([
      prisma.vehicleAssignment.findMany({
        where: { companyId, endedAt: null },
        select: { assignmentType: true },
        distinct: ['assignmentType'],
      }).then(r => r.map(a => a.assignmentType)),
      prisma.branch.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.department.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { assignmentTypes, branches, departments };
  }
}

export const assignmentRepository = new AssignmentRepository();
export const assignmentSearchRepository = new AssignmentSearchRepository();

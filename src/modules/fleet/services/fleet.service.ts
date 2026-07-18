import { prisma } from '@/lib/prisma';

export class FleetService {
  async getAvailability(companyId: string) {
    const now = new Date();

    const [
      totalVehicles,
      activeVehicles,
      inMaintenanceVehicles,
      reservedVehicles,
      outOfServiceVehicles,
      assignedVehicles,
      availableVehicles,
      totalDrivers,
      activeDrivers,
      suspendedDrivers,
      onLeaveDrivers,
      terminatedDrivers,
      assignedDrivers,
      availableDrivers,
      activeAssignments,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { companyId, deletedAt: null } }),
      prisma.vehicle.count({ where: { companyId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { companyId, deletedAt: null, status: 'IN_MAINTENANCE' } }),
      prisma.vehicle.count({ where: { companyId, deletedAt: null, status: 'RESERVED' } }),
      prisma.vehicle.count({ where: { companyId, deletedAt: null, status: 'OUT_OF_SERVICE' } }),
      prisma.vehicle.count({ where: { companyId, deletedAt: null, availability: 'ASSIGNED' } }),
      prisma.vehicle.count({ where: { companyId, deletedAt: null, availability: 'AVAILABLE' } }),
      prisma.driver.count({ where: { companyId, deletedAt: null } }),
      prisma.driver.count({ where: { companyId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.driver.count({ where: { companyId, deletedAt: null, status: 'SUSPENDED' } }),
      prisma.driver.count({ where: { companyId, deletedAt: null, status: 'ON_LEAVE' } }),
      prisma.driver.count({ where: { companyId, deletedAt: null, status: 'TERMINATED' } }),
      prisma.vehicleAssignment.count({ where: { companyId, endedAt: null } }),
      prisma.driver.count({
        where: {
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
          assignments: { none: { endedAt: null } },
        },
      }),
      prisma.vehicleAssignment.findMany({
        where: { companyId, endedAt: null },
        include: {
          vehicle: { select: { id: true, registrationNumber: true, make: true, model: true, status: true } },
          driver: { select: { id: true, firstName: true, lastName: true, email: true, status: true, employeeId: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { assignedAt: 'desc' },
      }),
    ]);

    // Vehicles with expired inspections
    let expiredInspectionVehicles = 0;
    try {
      expiredInspectionVehicles = await prisma.vehicle.count({
        where: {
          companyId,
          deletedAt: null,
          inspections: {
            some: {
              nextInspectionDate: { lt: now },
              isActive: true,
            },
          },
        },
      });
    } catch {
      // Inspection model may not exist
    }

    // Drivers with expired licenses
    let expiredLicenseDrivers = 0;
    try {
      expiredLicenseDrivers = await prisma.driver.count({
        where: {
          companyId,
          deletedAt: null,
          licenses: {
            some: {
              expiryDate: { lt: now },
              deletedAt: null,
            },
          },
        },
      });
    } catch {
      // License model may not be accessible this way
    }

    return {
      vehicles: {
        total: totalVehicles,
        active: activeVehicles,
        inMaintenance: inMaintenanceVehicles,
        reserved: reservedVehicles,
        outOfService: outOfServiceVehicles,
        assigned: assignedVehicles,
        available: availableVehicles,
        expiredInspections: expiredInspectionVehicles,
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        suspended: suspendedDrivers,
        onLeave: onLeaveDrivers,
        terminated: terminatedDrivers,
        assigned: assignedDrivers,
        available: availableDrivers,
        expiredLicenses: expiredLicenseDrivers,
      },
      assignments: {
        total: activeAssignments.length,
        list: activeAssignments,
      },
    };
  }

  async getAssignmentsByStatus(companyId: string) {
    const byType = await prisma.vehicleAssignment.groupBy({
      by: ['assignmentType'],
      where: { companyId, endedAt: null },
      _count: { id: true },
    });

    const byBranch = await prisma.vehicleAssignment.groupBy({
      by: ['branchId'],
      where: { companyId, endedAt: null },
      _count: { id: true },
    });

    return {
      byType: byType.map((b) => ({ type: b.assignmentType, count: b._count.id })),
      byBranch: byBranch.map((b) => ({ branchId: b.branchId, count: b._count.id })),
    };
  }
}

export const fleetService = new FleetService();

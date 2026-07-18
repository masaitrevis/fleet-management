import { prisma } from '@/lib/prisma';

export class MaintenanceAnalyticsService {
  async getOverview(companyId: string) {
    const [totalRecords, totalSchedules, totalWorkOrders, totalMechanics, totalDowntimes] =
      await Promise.all([
        prisma.maintenanceRecord.count({ where: { companyId, deletedAt: null } }),
        prisma.maintenanceSchedule.count({ where: { companyId, deletedAt: null } }),
        prisma.workOrder.count({ where: { companyId, deletedAt: null } }),
        prisma.mechanic.count({ where: { companyId, deletedAt: null } }),
        prisma.vehicleDowntime.count({ where: { companyId, deletedAt: null } }),
      ]);

    const overdueSchedules = await prisma.maintenanceSchedule.count({
      where: { companyId, deletedAt: null, isActive: true, nextDueDate: { lt: new Date() } },
    });

    const activeWorkOrders = await prisma.workOrder.count({
      where: { companyId, deletedAt: null, status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] } },
    });

    const completedWorkOrders = await prisma.workOrder.count({
      where: { companyId, deletedAt: null, status: 'COMPLETED' },
    });

    return {
      totalRecords,
      totalSchedules,
      totalWorkOrders,
      totalMechanics,
      totalDowntimes,
      overdueSchedules,
      activeWorkOrders,
      completedWorkOrders,
    };
  }

  async getCosts(companyId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const records = await prisma.maintenanceRecord.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(startDate || endDate ? { serviceDate: dateFilter } : {}),
      },
      select: {
        id: true,
        serviceDate: true,
        laborCost: true,
        partsCost: true,
        totalCost: true,
        taxAmount: true,
      },
    });

    const costsByType = await prisma.maintenanceCost.groupBy({
      by: ['costType'],
      where: {
        companyId,
        maintenanceRecord: { deletedAt: null },
      },
      _sum: { amount: true },
    });

    const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalLabor = records.reduce((sum, r) => sum + (r.laborCost || 0), 0);
    const totalParts = records.reduce((sum, r) => sum + (r.partsCost || 0), 0);
    const totalTax = records.reduce((sum, r) => sum + (r.taxAmount || 0), 0);

    return {
      totalCost,
      totalLabor,
      totalParts,
      totalTax,
      recordCount: records.length,
      averageCost: records.length > 0 ? totalCost / records.length : 0,
      costsByType,
      records: records.map((r) => ({
        id: r.id,
        serviceDate: r.serviceDate,
        laborCost: r.laborCost || 0,
        partsCost: r.partsCost || 0,
        totalCost: r.totalCost || 0,
        taxAmount: r.taxAmount || 0,
      })),
    };
  }

  async getDowntime(companyId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const downtimes = await prisma.vehicleDowntime.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(startDate || endDate ? { startDate: dateFilter } : {}),
      },
      include: {
        vehicle: { select: { id: true, registrationNumber: true } },
      },
    });

    const totalHours = downtimes.reduce((sum, d) => sum + (d.totalHours || 0), 0);
    const downtimeByReason = downtimes.reduce((acc, d) => {
      acc[d.reason] = (acc[d.reason] || 0) + (d.totalHours || 0);
      return acc;
    }, {} as Record<string, number>);

    const downtimeByVehicle = downtimes.reduce((acc, d) => {
      const key = d.vehicle?.registrationNumber || 'Unknown';
      acc[key] = (acc[key] || 0) + (d.totalHours || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDowntimes: downtimes.length,
      totalHours,
      averageHours: downtimes.length > 0 ? totalHours / downtimes.length : 0,
      downtimeByReason,
      downtimeByVehicle,
      downtimes: downtimes.map((d) => ({
        id: d.id,
        vehicle: d.vehicle?.registrationNumber,
        reason: d.reason,
        startDate: d.startDate,
        endDate: d.endDate,
        totalHours: d.totalHours,
      })),
    };
  }

  async getOverdue(companyId: string) {
    const overdueSchedules = await prisma.maintenanceSchedule.findMany({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        nextDueDate: { lt: new Date() },
      },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    const overdueWorkOrders = await prisma.workOrder.findMany({
      where: {
        companyId,
        deletedAt: null,
        scheduledDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return {
      overdueSchedules: overdueSchedules.map((s) => ({
        id: s.id,
        name: s.name,
        vehicle: s.vehicle?.registrationNumber,
        nextDueDate: s.nextDueDate,
        daysOverdue: s.nextDueDate ? Math.floor((new Date().getTime() - s.nextDueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      })),
      overdueWorkOrders: overdueWorkOrders.map((w) => ({
        id: w.id,
        workOrderNumber: w.workOrderNumber,
        title: w.title,
        vehicle: w.vehicle?.registrationNumber,
        scheduledDate: w.scheduledDate,
      })),
      totalOverdue: overdueSchedules.length + overdueWorkOrders.length,
    };
  }

  async getMechanicPerformance(companyId: string) {
    const mechanics = await prisma.mechanic.findMany({
      where: { companyId, deletedAt: null },
      include: {
        workOrders: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            actualCost: true,
            actualDuration: true,
            completionDate: true,
            startDate: true,
          },
        },
      },
    });

    return mechanics.map((m) => {
      const completed = m.workOrders.filter((w) => w.status === 'COMPLETED');
      const totalCost = completed.reduce((sum, w) => sum + (w.actualCost || 0), 0);
      const totalDuration = completed.reduce((sum, w) => sum + (w.actualDuration || 0), 0);
      const avgCompletionTime = completed.length > 0 ? totalDuration / completed.length : 0;

      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        totalJobs: m.workOrders.length,
        completedJobs: completed.length,
        pendingJobs: m.workOrders.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length,
        totalCost,
        averageCompletionTime: avgCompletionTime,
        hourlyRate: m.hourlyRate,
      };
    });
  }
}

export const maintenanceAnalyticsService = new MaintenanceAnalyticsService();

import { prisma } from '@/lib/prisma';

export interface FleetKPIs {
  totalVehicles: number;
  activeVehicles: number;
  vehicleUtilization: number;
  fleetAvailability: number;
  activeTrips: number;
  completedTrips: number;
  vehicleDowntime: number;
  avgTripDuration: number;
}

export interface DriverKPIs {
  totalDrivers: number;
  activeDrivers: number;
  driverUtilization: number;
  safetyScore: number;
  drivingHours: number;
  overtimeHours: number;
}

export interface FuelKPIs {
  totalConsumption: number;
  totalCost: number;
  costPerKm: number;
  avgEfficiency: number;
  fraudAlerts: number;
}

export interface MaintenanceKPIs {
  totalCost: number;
  vehiclesDueService: number;
  avgRepairCost: number;
  downtime: number;
  workshopPerformance: number;
}

export interface ComplianceKPIs {
  complianceScore: number;
  expiringDocuments: number;
  inspectionPassRate: number;
  violations: number;
  incidents: number;
}

export interface FinancialKPIs {
  operatingCost: number;
  maintenanceCost: number;
  fuelCost: number;
  costPerVehicle: number;
  costPerDriver: number;
}

export class KPICalculator {
  constructor(private companyId: string) {}

  async getFleetKPIs(dateRange?: { startDate: Date; endDate: Date }): Promise<FleetKPIs> {
    const where = { companyId: this.companyId, deletedAt: null };
    const tripWhere = { ...where, ...(dateRange ? { startTime: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) };

    const [totalVehicles, activeVehicles, activeTrips, completedTrips, avgTrip, downtime] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.trip.count({ where: { ...tripWhere, status: 'IN_PROGRESS' } }),
      prisma.trip.count({ where: { ...tripWhere, status: 'COMPLETED' } }),
      prisma.trip.aggregate({ where: tripWhere, _avg: { distance: true, totalCost: true }, _sum: { distance: true } }),
      prisma.vehicleDowntime.aggregate({ where: { ...where, ...(dateRange ? { startDate: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { totalHours: true } }),
    ]);

    const assignedVehicles = await prisma.vehicleAssignment.count({ where: { companyId: this.companyId, endedAt: null } });
    const utilization = totalVehicles > 0 ? (assignedVehicles / totalVehicles) * 100 : 0;
    const availability = totalVehicles > 0 ? ((totalVehicles - activeVehicles + assignedVehicles) / totalVehicles) * 100 : 0;

    return {
      totalVehicles,
      activeVehicles,
      vehicleUtilization: Math.round(utilization * 100) / 100,
      fleetAvailability: Math.round(availability * 100) / 100,
      activeTrips,
      completedTrips,
      vehicleDowntime: downtime._sum.totalHours || 0,
      avgTripDuration: Math.round((avgTrip._avg.distance || 0) * 100) / 100,
    };
  }

  async getDriverKPIs(dateRange?: { startDate: Date; endDate: Date }): Promise<DriverKPIs> {
    const where = { companyId: this.companyId, deletedAt: null };
    const shiftWhere = { ...where, ...(dateRange ? { startTime: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) };

    const [totalDrivers, activeDrivers, shifts, behaviors] = await Promise.all([
      prisma.driver.count({ where }),
      prisma.driver.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.shift.count({ where: { ...where, isActive: true } }),
      prisma.driverBehavior.aggregate({ where: { companyId: this.companyId, ...(dateRange ? { periodStart: { gte: dateRange.startDate }, periodEnd: { lte: dateRange.endDate } } : {}) }, _sum: { totalDuration: true }, _avg: { safetyScore: true } }),
    ]);

    const assignedDriversResult = await prisma.vehicleAssignment.findMany({
      where: { companyId: this.companyId, endedAt: null },
      distinct: ['driverId'],
      select: { driverId: true },
    });
    const assignedDrivers = assignedDriversResult.length;
    const utilization = totalDrivers > 0 ? (assignedDrivers / totalDrivers) * 100 : 0;
    const drivingHours = Math.round((behaviors._sum.totalDuration || 0) / 60);

    return {
      totalDrivers,
      activeDrivers,
      driverUtilization: Math.round(utilization * 100) / 100,
      safetyScore: Math.round((behaviors._avg.safetyScore || 0) * 100) / 100,
      drivingHours,
      overtimeHours: 0, // TODO: calculate from shift data
    };
  }

  async getFuelKPIs(dateRange?: { startDate: Date; endDate: Date }): Promise<FuelKPIs> {
    const where = { companyId: this.companyId, ...(dateRange ? { date: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) };

    const [logs, fraudAlerts] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { companyId: this.companyId, ...(dateRange ? { fuelDate: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { quantity: true, totalCost: true }, _avg: { consumptionRate: true } }),
      prisma.fuelFraudAlert.count({ where: { companyId: this.companyId, ...(dateRange ? { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) } }),
    ]);

    const totalKm = await prisma.trip.aggregate({
      where: { companyId: this.companyId, ...(dateRange ? { startTime: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}), status: 'COMPLETED' },
      _sum: { distance: true },
    });

    const totalConsumption = logs._sum.quantity || 0;
    const totalCost = logs._sum.totalCost || 0;
    const km = totalKm._sum.distance || 1;

    return {
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerKm: Math.round((totalCost / km) * 100) / 100,
      avgEfficiency: Math.round((logs._avg.consumptionRate || 0) * 100) / 100,
      fraudAlerts,
    };
  }

  async getMaintenanceKPIs(dateRange?: { startDate: Date; endDate: Date }): Promise<MaintenanceKPIs> {
    const where = { companyId: this.companyId, deletedAt: null };
    const recordWhere = { ...where, ...(dateRange ? { completedDate: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) };

    const [totalCost, vehiclesDue, records, downtime] = await Promise.all([
      prisma.maintenanceCost.aggregate({ where: { companyId: this.companyId, ...(dateRange ? { date: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { amount: true } }),
      prisma.maintenanceSchedule.count({ where: { ...where, nextDueDate: { lte: new Date() } } }),
      prisma.maintenanceRecord.aggregate({ where: recordWhere, _avg: { totalCost: true }, _count: { id: true } }),
      prisma.vehicleDowntime.aggregate({ where: { ...where, ...(dateRange ? { startDate: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { totalHours: true } }),
    ]);

    return {
      totalCost: totalCost._sum.amount || 0,
      vehiclesDueService: vehiclesDue,
      avgRepairCost: Math.round((records._avg.totalCost || 0) * 100) / 100,
      downtime: downtime._sum.totalHours || 0,
      workshopPerformance: records._count.id > 0 ? 100 : 0,
    };
  }

  async getComplianceKPIs(): Promise<ComplianceKPIs> {
    const where = { companyId: this.companyId, deletedAt: null };

    const [expiringDocs, totalInspections, passedInspections, violations, incidents] = await Promise.all([
      prisma.vehicleDocument.count({ where: { ...where, expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() } } }),
      prisma.inspection.count({ where: { companyId: this.companyId, deletedAt: null } }),
      prisma.inspection.count({ where: { companyId: this.companyId, deletedAt: null, result: 'PASS' } }),
      prisma.complianceCheck.count({ where: { companyId: this.companyId, status: 'FAIL', deletedAt: null } }),
      prisma.incident.count({ where: { companyId: this.companyId, deletedAt: null } }),
    ]);

    const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    return {
      complianceScore: Math.round(passRate * 100) / 100,
      expiringDocuments: expiringDocs,
      inspectionPassRate: Math.round(passRate * 100) / 100,
      violations,
      incidents,
    };
  }

  async getFinancialKPIs(dateRange?: { startDate: Date; endDate: Date }): Promise<FinancialKPIs> {
    const where = { companyId: this.companyId, ...(dateRange ? { date: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) };

    const [maintenanceCost, fuelCost, expenses, vehicles, drivers] = await Promise.all([
      prisma.maintenanceCost.aggregate({ where: { companyId: this.companyId, ...(dateRange ? { date: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { amount: true } }),
      prisma.fuelLog.aggregate({ where: { companyId: this.companyId, ...(dateRange ? { fuelDate: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { totalCost: true } }),
      prisma.expense.aggregate({ where: { companyId: this.companyId, ...(dateRange ? { expenseDate: { gte: dateRange.startDate, lte: dateRange.endDate } } : {}) }, _sum: { amount: true } }),
      prisma.vehicle.count({ where: { companyId: this.companyId, deletedAt: null } }),
      prisma.driver.count({ where: { companyId: this.companyId, deletedAt: null } }),
    ]);

    const maintenance = maintenanceCost._sum.amount || 0;
    const fuel = fuelCost._sum.totalCost || 0;
    const other = expenses._sum.amount || 0;
    const operatingCost = maintenance + fuel + other;

    return {
      operatingCost: Math.round(operatingCost * 100) / 100,
      maintenanceCost: Math.round(maintenance * 100) / 100,
      fuelCost: Math.round(fuel * 100) / 100,
      costPerVehicle: vehicles > 0 ? Math.round((operatingCost / vehicles) * 100) / 100 : 0,
      costPerDriver: drivers > 0 ? Math.round((operatingCost / drivers) * 100) / 100 : 0,
    };
  }

  async getAllKPIs(dateRange?: { startDate: Date; endDate: Date }) {
    const [fleet, driver, fuel, maintenance, compliance, financial] = await Promise.all([
      this.getFleetKPIs(dateRange),
      this.getDriverKPIs(dateRange),
      this.getFuelKPIs(dateRange),
      this.getMaintenanceKPIs(dateRange),
      this.getComplianceKPIs(),
      this.getFinancialKPIs(dateRange),
    ]);

    return { fleet, driver, fuel, maintenance, compliance, financial };
  }
}

export default KPICalculator;

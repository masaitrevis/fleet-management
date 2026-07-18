import { prisma } from '@/lib/prisma';
import { Report, ReportType, ReportCategory, ReportFormat, ScheduleFrequency } from '@prisma/client';
import { KPICalculator } from '../engine/kpi-calculator';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
  status?: string;
  category?: string;
  branch?: string;
  department?: string;
}

export class ReportService {
  constructor(private companyId: string) {}

  async generateReport(type: ReportType, category: ReportCategory, name: string, filters: ReportFilters, format: ReportFormat = ReportFormat.JSON): Promise<Report> {
    const kpi = new KPICalculator(this.companyId);
    const dateRange = filters.startDate && filters.endDate ? { startDate: filters.startDate, endDate: filters.endDate } : undefined;

    let data: any = {};
    let summary: any = {};

    switch (type) {
      case ReportType.FLEET:
        data = await kpi.getFleetKPIs(dateRange);
        break;
      case ReportType.DRIVER:
        data = await kpi.getDriverKPIs(dateRange);
        break;
      case ReportType.FUEL:
        data = await kpi.getFuelKPIs(dateRange);
        break;
      case ReportType.MAINTENANCE:
        data = await kpi.getMaintenanceKPIs(dateRange);
        break;
      case ReportType.COMPLIANCE:
        data = await kpi.getComplianceKPIs();
        break;
      case ReportType.FINANCIAL:
        data = await kpi.getFinancialKPIs(dateRange);
        break;
      case ReportType.TRIP:
        data = await this.getTripReportData(filters);
        break;
      case ReportType.GPS:
        data = await this.getGPSReportData(filters);
        break;
      case ReportType.INVENTORY:
        data = await this.getInventoryReportData(filters);
        break;
      default:
        data = await kpi.getAllKPIs(dateRange);
    }

    summary = this.generateSummary(data, type);

    const report = await prisma.report.create({
      data: {
        companyId: this.companyId,
        name,
        type,
        category,
        filters: filters as any,
        parameters: { format, generatedAt: new Date() } as any,
        data,
        result: data,
        summary,
        format,
        status: 'COMPLETED',
        generatedAt: new Date(),
      },
    });

    return report;
  }

  private async getTripReportData(filters: ReportFilters) {
    const where: any = { companyId: this.companyId, deletedAt: null };
    if (filters.startDate) where.startTime = { gte: filters.startDate };
    if (filters.endDate) where.startTime = { ...where.startTime, lte: filters.endDate };
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.status) where.status = filters.status;

    const [trips, aggregates] = await Promise.all([
      prisma.trip.findMany({ where, take: 1000, orderBy: { startTime: 'desc' } }),
      prisma.trip.aggregate({ where, _avg: { distance: true, totalCost: true, fuelCost: true }, _sum: { distance: true, totalCost: true } }),
    ]);

    return { trips, aggregates };
  }

  private async getGPSReportData(filters: ReportFilters) {
    const where: any = { companyId: this.companyId };
    if (filters.startDate) where.timestamp = { gte: filters.startDate };
    if (filters.endDate) where.timestamp = { ...where.timestamp, lte: filters.endDate };
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;

    const [locations, aggregates] = await Promise.all([
      prisma.vehicleLocation.findMany({ where, take: 1000, orderBy: { timestamp: 'desc' } }),
      prisma.vehicleLocation.aggregate({ where, _avg: { speed: true } }),
    ]);

    return { locations, aggregates };
  }

  private async getInventoryReportData(filters: ReportFilters) {
    const where: any = { companyId: this.companyId, deletedAt: null };

    const [parts, movements] = await Promise.all([
      prisma.inventoryPart.findMany({ where, take: 500 }),
      prisma.stockMovement.findMany({ where: { companyId: this.companyId }, take: 500, orderBy: { createdAt: 'desc' } }),
    ]);

    return { parts, movements, valuation: { partsCount: parts.length } };
  }

  private generateSummary(data: any, type: ReportType) {
    return { generatedAt: new Date(), type, recordCount: Array.isArray(data?.trips) ? data.trips.length : 0 };
  }

  async getReports(type?: ReportType, category?: ReportCategory, page = 1, limit = 20) {
    const where: any = { companyId: this.companyId, deletedAt: null };
    if (type) where.type = type;
    if (category) where.category = category;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  async getReportById(id: string) {
    return prisma.report.findFirst({ where: { id, companyId: this.companyId, deletedAt: null } });
  }

  async deleteReport(id: string) {
    return prisma.report.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export default ReportService;

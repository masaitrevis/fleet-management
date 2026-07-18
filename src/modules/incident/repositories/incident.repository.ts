import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/shared/errors/AppError';

function generateIncidentNumber(): string { return 'INC-' + Date.now().toString(36).toUpperCase(); }

export class IncidentRepository {
  async findAll(companyId: string, search: any) {
    const where: Prisma.IncidentWhereInput = { companyId, deletedAt: null };
    if (search.q) where.title = { contains: search.q, mode: 'insensitive' };
    if (search.incidentType) where.incidentType = search.incidentType;
    if (search.severity) where.severity = search.severity;
    if (search.status) where.status = search.status;
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.driverId) where.driverId = search.driverId;

    const pageNum = Number(search.page) || 1;
    const limitNum = Number(search.limit) || 20;
    const [data, total] = await Promise.all([
      prisma.incident.findMany({
        where, skip: (pageNum - 1) * limitNum as number, take: limitNum as number,
        include: { vehicle: { select: { registrationNumber: true, make: true, model: true } }, driver: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);
    return { incidents: data, total };
  }

  async findById(id: string, companyId: string) {
    const incident = await prisma.incident.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { vehicle: true, driver: true, trip: true, attachments: true, correctiveActions: true },
    });
    if (!incident) throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    return incident;
  }

  async create(companyId: string, data: any) {
    return prisma.incident.create({
      data: { ...data, companyId, incidentNumber: generateIncidentNumber() },
      include: { vehicle: true, driver: true },
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findById(id, companyId);
    return prisma.incident.update({ where: { id }, data, include: { vehicle: true, driver: true } });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.incident.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const incidentRepository = new IncidentRepository();

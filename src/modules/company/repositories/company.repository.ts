import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class CompanyRepository {
  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { companyUsers: true, vehicles: true, drivers: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.company.findUnique({
      where: { slug },
    });
  }

  async update(id: string, data: Prisma.CompanyUpdateInput) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }

  async updateSettings(id: string, settings: Record<string, unknown>) {
    return prisma.company.update({
      where: { id },
      data: { settings: settings as Prisma.InputJsonValue },
    });
  }

  async softDelete(id: string) {
    return prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'SUSPENDED' },
    });
  }
}

export const companyRepository = new CompanyRepository();

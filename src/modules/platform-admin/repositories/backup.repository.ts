import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BackupRepository {
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BackupRecordWhereInput;
    orderBy?: Prisma.BackupRecordOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.backupRecord.findMany(params),
      prisma.backupRecord.count({ where: params.where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    return prisma.backupRecord.findUnique({ where: { id } });
  }

  async create(data: Prisma.BackupRecordCreateInput) {
    return prisma.backupRecord.create({ data });
  }

  async update(id: string, data: Prisma.BackupRecordUpdateInput) {
    return prisma.backupRecord.update({ where: { id }, data });
  }
}

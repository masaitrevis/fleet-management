import { PlatformUserRepository } from '../repositories/platform-user.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreatePlatformUserSchema, UpdatePlatformUserSchema } from '../dto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export class PlatformUserService {
  private repo = new PlatformUserRepository();
  private auditRepo = new AuditLogRepository();

  async listUsers(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.repo.findAll({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUser(id: string) {
    return this.repo.findById(id);
  }

  async createUser(data: z.infer<typeof CreatePlatformUserSchema>, createdBy?: string) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.repo.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone,
      locale: data.locale,
      timezone: data.timezone,
    });

    await this.auditRepo.create({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'PlatformUser',
      entityId: user.id,
      details: `Created platform user ${data.email} with role ${data.role}`,
    });

    return user;
  }

  async updateUser(id: string, data: z.infer<typeof UpdatePlatformUserSchema>, updatedBy?: string) {
    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.locale) updateData.locale = data.locale;
    if (data.timezone) updateData.timezone = data.timezone;

    const user = await this.repo.update(id, updateData);

    await this.auditRepo.create({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'PlatformUser',
      entityId: id,
      details: `Updated platform user ${id}`,
    });

    return user;
  }

  async deleteUser(id: string, deletedBy?: string) {
    const user = await this.repo.delete(id);

    await this.auditRepo.create({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'PlatformUser',
      entityId: id,
      details: `Deleted platform user ${id}`,
    });

    return user;
  }
}

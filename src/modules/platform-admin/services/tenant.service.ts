import { TenantRepository } from '../repositories/tenant.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { TenantSearchSchema } from '../dto';
import { z } from 'zod';

export class TenantService {
  private repo = new TenantRepository();
  private auditRepo = new AuditLogRepository();

  async listTenants(params: z.infer<typeof TenantSearchSchema>) {
    const { query, status, page, limit } = params;
    const where: any = { deletedAt: null };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;

    return this.repo.findAll({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenant(id: string) {
    return this.repo.findById(id);
  }

  async suspendTenant(id: string, adminId: string) {
    const result = await this.repo.updateStatus(id, 'SUSPENDED');
    await this.auditRepo.create({
      userId: adminId,
      action: 'SUSPEND_TENANT',
      entityType: 'Company',
      entityId: id,
      details: `Tenant ${id} suspended`,
    });
    return result;
  }

  async activateTenant(id: string, adminId: string) {
    const result = await this.repo.updateStatus(id, 'ACTIVE');
    await this.auditRepo.create({
      userId: adminId,
      action: 'ACTIVATE_TENANT',
      entityType: 'Company',
      entityId: id,
      details: `Tenant ${id} activated`,
    });
    return result;
  }

  async deleteTenant(id: string, adminId: string) {
    const result = await this.repo.softDelete(id);
    await this.auditRepo.create({
      userId: adminId,
      action: 'DELETE_TENANT',
      entityType: 'Company',
      entityId: id,
      details: `Tenant ${id} soft deleted`,
    });
    return result;
  }

  async getTenantUsage(id: string) {
    return this.repo.getUsageStats(id);
  }

  async generateImpersonationToken(companyId: string, adminId: string) {
    const { sign } = await import('jsonwebtoken');
    const token = sign(
      { sub: adminId, cid: companyId, impersonated: true, iat: Date.now() },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '1h' }
    );
    await this.auditRepo.create({
      userId: adminId,
      action: 'IMPERSONATE',
      entityType: 'Company',
      entityId: companyId,
      details: `Admin impersonated tenant ${companyId}`,
    });
    return { token, expiresIn: '1h' };
  }
}

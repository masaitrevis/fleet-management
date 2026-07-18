import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '../services/tenant.service';
import { TenantSearchSchema } from '../dto';
import { z } from 'zod';

export class TenantController {
  private static service = new TenantService();

  static async list(req: NextRequest) {
    const url = new URL(req.url);
    const rawParams = {
      query: url.searchParams.get('query') || undefined,
      status: url.searchParams.get('status') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
    };
    const params = TenantSearchSchema.parse(rawParams);
    const result = await TenantController.service.listTenants(params);
    return NextResponse.json({ success: true, data: result });
  }

  static async getById(req: NextRequest, id: string) {
    const tenant = await TenantController.service.getTenant(id);
    if (!tenant) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: tenant });
  }

  static async suspend(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id')!;
    const result = await TenantController.service.suspendTenant(id, adminId);
    return NextResponse.json({ success: true, data: result });
  }

  static async activate(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id')!;
    const result = await TenantController.service.activateTenant(id, adminId);
    return NextResponse.json({ success: true, data: result });
  }

  static async delete(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id')!;
    const result = await TenantController.service.deleteTenant(id, adminId);
    return NextResponse.json({ success: true, data: result });
  }

  static async impersonate(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id')!;
    const result = await TenantController.service.generateImpersonationToken(id, adminId);
    return NextResponse.json({ success: true, data: result });
  }

  static async getUsage(req: NextRequest, id: string) {
    const stats = await TenantController.service.getTenantUsage(id);
    return NextResponse.json({ success: true, data: stats });
  }
}

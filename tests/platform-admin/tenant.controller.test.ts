import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantController } from '@/modules/platform-admin/controllers/tenant.controller';
import { NextRequest } from 'next/server';

vi.mock('@/modules/platform-admin/services/tenant.service');

describe('Tenant Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list tenants', async () => {
    const req = new NextRequest('http://localhost/api/admin/tenants?page=1&limit=20');
    const res = await TenantController.list(req);
    expect(res.status).toBe(200);
  });
});

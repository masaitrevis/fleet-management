import { describe, it, expect, vi } from 'vitest';
import { SecurityController } from '@/modules/platform-admin/controllers/security.controller';
import { NextRequest } from 'next/server';

vi.mock('@/modules/platform-admin/services/security.service');

describe('Security Controller', () => {
  it('should return security dashboard data', async () => {
    const req = new NextRequest('http://localhost/api/admin/security');
    const res = await SecurityController.getDashboard(req);
    expect(res.status).toBe(200);
  });
});

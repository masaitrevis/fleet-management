import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { adminAuthMiddleware } from '@/modules/platform-admin/middleware/admin-auth.middleware';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformUser: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Admin Auth Middleware', () => {
  it('should reject requests without authorization', async () => {
    const req = new NextRequest('http://localhost/api/admin/dashboard');
    await expect(adminAuthMiddleware(req)).rejects.toThrow();
  });

  it('should allow requests with valid admin token', async () => {
    process.env.ADMIN_API_TOKEN = 'test-admin-token';
    const req = new NextRequest('http://localhost/api/admin/dashboard', {
      headers: { 'x-admin-token': 'test-admin-token' },
    });
    const result = await adminAuthMiddleware(req);
    expect(result.user.role).toBe('SUPER_ADMIN');
  });
});

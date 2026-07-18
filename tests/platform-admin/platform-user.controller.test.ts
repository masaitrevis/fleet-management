import { describe, it, expect, vi } from 'vitest';
import { PlatformUserController } from '@/modules/platform-admin/controllers/platform-user.controller';
import { NextRequest } from 'next/server';

vi.mock('@/modules/platform-admin/services/platform-user.service');

describe('Platform User Controller', () => {
  it('should create a platform user', async () => {
    const req = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'SUPPORT',
      }),
    });
    const res = await PlatformUserController.create(req);
    expect(res.status).toBe(201);
  });
});

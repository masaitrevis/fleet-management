import { describe, it, expect, vi } from 'vitest';
import { FeatureFlagController } from '@/modules/platform-admin/controllers/feature-flag.controller';
import { NextRequest } from 'next/server';

vi.mock('@/modules/platform-admin/services/feature-flag.service');

describe('Feature Flag Controller', () => {
  it('should list feature flags', async () => {
    const req = new NextRequest('http://localhost/api/admin/feature-flags');
    const res = await FeatureFlagController.list(req);
    expect(res.status).toBe(200);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { SystemConfigController } from '../../src/modules/platform-admin/controllers/system-config.controller';
import { SystemConfigService } from '../../src/modules/platform-admin/services/system-config.service';

vi.mock('../../src/modules/platform-admin/services/system-config.service', () => ({
  SystemConfigService: vi.fn().mockImplementation(() => ({
    getAllConfig: vi.fn(),
    updateConfig: vi.fn(),
  })),
}));

describe('SystemConfigController', () => {
  let mockService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new (SystemConfigService as any)();
    (SystemConfigController as any).service = mockService;
  });

  describe('getAll', () => {
    it('should return all system config', async () => {
      const req = new NextRequest('http://localhost/api/admin/system-config');
      const mockConfig = [
        { id: 'cfg1', key: 'max_vehicles', value: '100', category: 'limits' },
        { id: 'cfg2', key: 'session_timeout', value: '3600', category: 'security' },
      ];
      mockService.getAllConfig.mockResolvedValue(mockConfig);

      const res = await SystemConfigController.getAll(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockConfig);
      expect(mockService.getAllConfig).toHaveBeenCalledWith(undefined);
    });

    it('should filter config by category', async () => {
      const req = new NextRequest('http://localhost/api/admin/system-config?category=security');
      const mockConfig = [{ id: 'cfg2', key: 'session_timeout', value: '3600', category: 'security' }];
      mockService.getAllConfig.mockResolvedValue(mockConfig);

      const res = await SystemConfigController.getAll(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.getAllConfig).toHaveBeenCalledWith('security');
    });
  });

  describe('update', () => {
    it('should update a config value', async () => {
      const req = new NextRequest('http://localhost/api/admin/system-config', {
        method: 'PUT',
        headers: { 'x-admin-id': 'admin-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'max_vehicles',
          value: '200',
          category: 'limits',
          description: 'Maximum vehicles per tenant',
        }),
      });
      const mockConfig = { id: 'cfg1', key: 'max_vehicles', value: '200', category: 'limits' };
      mockService.updateConfig.mockResolvedValue(mockConfig);

      const res = await SystemConfigController.update(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockConfig);
      expect(mockService.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'max_vehicles', value: '200' }),
        'admin-1'
      );
    });

    it('should create encrypted config value', async () => {
      const req = new NextRequest('http://localhost/api/admin/system-config', {
        method: 'PUT',
        headers: { 'x-admin-id': 'admin-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stripe_secret_key',
          value: 'sk_live_xxxxxxxxxxxx',
          category: 'payments',
          isEncrypted: true,
          description: 'Stripe secret key',
        }),
      });
      const mockConfig = {
        id: 'cfg3',
        key: 'stripe_secret_key',
        value: '***encrypted***',
        category: 'payments',
        isEncrypted: true,
      };
      mockService.updateConfig.mockResolvedValue(mockConfig);

      const res = await SystemConfigController.update(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isEncrypted).toBe(true);
    });
  });
});

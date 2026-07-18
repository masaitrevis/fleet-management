import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AuditLogController } from '../../src/modules/platform-admin/controllers/audit-log.controller';
import { AuditLogService } from '../../src/modules/platform-admin/services/audit-log.service';

vi.mock('../../src/modules/platform-admin/services/audit-log.service', () => ({
  AuditLogService: vi.fn().mockImplementation(() => ({
    listLogs: vi.fn(),
  })),
}));

describe('AuditLogController', () => {
  let mockService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new (AuditLogService as any)();
    (AuditLogController as any).service = mockService;
  });

  describe('list', () => {
    it('should list audit logs with default pagination', async () => {
      const req = new NextRequest('http://localhost/api/admin/audit-logs');
      const mockData = {
        items: [
          { id: 'a1', userId: 'admin-1', action: 'CREATE', entityType: 'Tenant', entityId: 't1', createdAt: new Date() },
        ],
        total: 1,
      };
      mockService.listLogs.mockResolvedValue(mockData);

      const res = await AuditLogController.list(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockData);
      expect(mockService.listLogs).toHaveBeenCalledWith({ page: 1, limit: 20, userId: undefined, action: undefined, entityType: undefined });
    });

    it('should filter audit logs by userId', async () => {
      const req = new NextRequest('http://localhost/api/admin/audit-logs?userId=admin-1&page=1&limit=10');
      const mockData = { items: [], total: 0 };
      mockService.listLogs.mockResolvedValue(mockData);

      const res = await AuditLogController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.listLogs).toHaveBeenCalledWith(expect.objectContaining({ userId: 'admin-1' }));
    });

    it('should filter audit logs by action', async () => {
      const req = new NextRequest('http://localhost/api/admin/audit-logs?action=SUSPEND_TENANT');
      const mockData = { items: [], total: 0 };
      mockService.listLogs.mockResolvedValue(mockData);

      const res = await AuditLogController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.listLogs).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUSPEND_TENANT' }));
    });

    it('should filter audit logs by entityType', async () => {
      const req = new NextRequest('http://localhost/api/admin/audit-logs?entityType=PlatformUser');
      const mockData = { items: [], total: 0 };
      mockService.listLogs.mockResolvedValue(mockData);

      const res = await AuditLogController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.listLogs).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'PlatformUser' }));
    });

    it('should apply combined filters', async () => {
      const req = new NextRequest('http://localhost/api/admin/audit-logs?userId=admin-1&action=CREATE&entityType=Tenant&page=2&limit=50');
      const mockData = { items: [], total: 0 };
      mockService.listLogs.mockResolvedValue(mockData);

      const res = await AuditLogController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.listLogs).toHaveBeenCalledWith({
        page: 2,
        limit: 50,
        userId: 'admin-1',
        action: 'CREATE',
        entityType: 'Tenant',
      });
    });

    it('should support export via filtered list', async () => {
      const req = new NextRequest('http://localhost/api/admin/audit-logs?action=DELETE&limit=500');
      const mockData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `del-${i}`,
          action: 'DELETE',
          entityType: 'Vehicle',
          createdAt: new Date(),
        })),
        total: 100,
      };
      mockService.listLogs.mockResolvedValue(mockData);

      const res = await AuditLogController.list(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.items.length).toBe(100);
      expect(mockService.listLogs).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE', limit: 500 }));
    });
  });
});

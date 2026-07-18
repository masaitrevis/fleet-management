import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { BackupController } from '../../src/modules/platform-admin/controllers/backup.controller';
import { BackupService } from '../../src/modules/platform-admin/services/backup.service';

vi.mock('../../src/modules/platform-admin/services/backup.service', () => ({
  BackupService: vi.fn().mockImplementation(() => ({
    listBackups: vi.fn(),
    triggerBackup: vi.fn(),
  })),
}));

describe('BackupController', () => {
  let mockService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new (BackupService as any)();
    (BackupController as any).service = mockService;
  });

  describe('list', () => {
    it('should list backups with default pagination', async () => {
      const req = new NextRequest('http://localhost/api/admin/backups');
      const mockData = {
        items: [
          { id: 'b1', type: 'MANUAL', status: 'COMPLETED', size: 104857600, path: '/backups/manual/b1.sql.gz' },
        ],
        total: 1,
      };
      mockService.listBackups.mockResolvedValue(mockData);

      const res = await BackupController.list(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockData);
      expect(mockService.listBackups).toHaveBeenCalledWith({ page: 1, limit: 20, status: undefined });
    });

    it('should filter backups by status', async () => {
      const req = new NextRequest('http://localhost/api/admin/backups?status=COMPLETED&page=1&limit=10');
      const mockData = { items: [], total: 0 };
      mockService.listBackups.mockResolvedValue(mockData);

      const res = await BackupController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.listBackups).toHaveBeenCalledWith({ page: 1, limit: 10, status: 'COMPLETED' });
    });
  });

  describe('create', () => {
    it('should trigger a manual backup', async () => {
      const req = new NextRequest('http://localhost/api/admin/backups', {
        method: 'POST',
        headers: { 'x-admin-id': 'admin-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MANUAL' }),
      });
      const mockRecord = { id: 'b2', type: 'MANUAL', status: 'IN_PROGRESS', createdBy: 'admin-1' };
      mockService.triggerBackup.mockResolvedValue(mockRecord);

      const res = await BackupController.create(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockRecord);
      expect(mockService.triggerBackup).toHaveBeenCalledWith('MANUAL', 'admin-1');
    });

    it('should trigger an auto backup when type not specified', async () => {
      const req = new NextRequest('http://localhost/api/admin/backups', {
        method: 'POST',
        headers: { 'x-admin-id': 'admin-1', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const mockRecord = { id: 'b3', type: 'MANUAL', status: 'IN_PROGRESS' };
      mockService.triggerBackup.mockResolvedValue(mockRecord);

      const res = await BackupController.create(req);

      expect(mockService.triggerBackup).toHaveBeenCalledWith('MANUAL', 'admin-1');
    });
  });

  describe('backup provider interface', () => {
    it('should list backups returned by the provider', async () => {
      const req = new NextRequest('http://localhost/api/admin/backups');
      const mockData = {
        items: [
          { id: 'backup_1699999999999', path: '/backups/SCHEDULED/backup_1699999999999.sql.gz', size: 52428800, status: 'COMPLETED' },
        ],
        total: 1,
      };
      mockService.listBackups.mockResolvedValue(mockData);

      const res = await BackupController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data.items[0].path).toContain('/backups/');
    });
  });
});

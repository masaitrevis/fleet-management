import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { MonitoringController } from '../../src/modules/platform-admin/controllers/monitoring.controller';
import { MonitoringService } from '../../src/modules/platform-admin/services/monitoring.service';

vi.mock('../../src/modules/platform-admin/services/monitoring.service', () => ({
  MonitoringService: vi.fn().mockImplementation(() => ({
    getMonitoringData: vi.fn(),
  })),
}));

describe('MonitoringController', () => {
  let mockService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new (MonitoringService as any)();
    (MonitoringController as any).service = mockService;
  });

  describe('getData', () => {
    it('should return monitoring metrics', async () => {
      const req = new NextRequest('http://localhost/api/admin/monitoring');
      const mockData = {
        cpuUsage: 35.5,
        memoryUsage: 62.3,
        diskUsage: 48.1,
        dbConnections: 12,
        dbConnectionLimit: 100,
        apiResponseTimeAvg: 120,
        apiRequestsPerMinute: 350,
        errorRate: 0.5,
        uptime: 99.9,
        timestamps: Array.from({ length: 10 }, (_, i) => new Date(Date.now() - (9 - i) * 60000)),
      };
      mockService.getMonitoringData.mockResolvedValue(mockData);

      const res = await MonitoringController.getData(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.cpuUsage).toBe(35.5);
      expect(body.data.memoryUsage).toBe(62.3);
      expect(body.data.uptime).toBe(99.9);
    });

    it('should return monitoring data with provider metrics', async () => {
      const req = new NextRequest('http://localhost/api/admin/monitoring');
      const mockData = {
        cpuUsage: 45.2,
        memoryUsage: 70.0,
        diskUsage: 55.5,
        dbConnections: 25,
        dbConnectionLimit: 100,
        apiResponseTimeAvg: 85,
        apiRequestsPerMinute: 420,
        errorRate: 1.2,
        uptime: 99.95,
        timestamps: [],
      };
      mockService.getMonitoringData.mockResolvedValue(mockData);

      const res = await MonitoringController.getData(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data.dbConnections).toBeLessThan(body.data.dbConnectionLimit);
      expect(body.data.errorRate).toBeLessThan(5);
    });
  });

  describe('provider mock data', () => {
    it('should return data from mock monitoring provider', async () => {
      const req = new NextRequest('http://localhost/api/admin/monitoring');
      const mockData = {
        cpuUsage: 28.0,
        memoryUsage: 55.0,
        diskUsage: 40.0,
        dbConnections: 8,
        dbConnectionLimit: 100,
        apiResponseTimeAvg: 95,
        apiRequestsPerMinute: 280,
        errorRate: 0.8,
        uptime: 99.9,
        timestamps: [new Date()],
      };
      mockService.getMonitoringData.mockResolvedValue(mockData);

      const res = await MonitoringController.getData(req);
      const body = await res.json();

      expect(body.data.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(body.data.cpuUsage).toBeLessThanOrEqual(100);
      expect(body.data.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(body.data.memoryUsage).toBeLessThanOrEqual(100);
      expect(body.data.diskUsage).toBeGreaterThanOrEqual(0);
      expect(body.data.diskUsage).toBeLessThanOrEqual(100);
    });
  });
});

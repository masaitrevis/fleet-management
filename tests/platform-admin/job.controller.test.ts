import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { JobController } from '../../src/modules/platform-admin/controllers/job.controller';
import { JobService } from '../../src/modules/platform-admin/services/job.service';

vi.mock('../../src/modules/platform-admin/services/job.service', () => ({
  JobService: vi.fn().mockImplementation(() => ({
    listJobs: vi.fn(),
    retryJob: vi.fn(),
    cancelJob: vi.fn(),
  })),
}));

describe('JobController', () => {
  let mockService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new (JobService as any)();
    (JobController as any).service = mockService;
  });

  describe('list', () => {
    it('should list jobs with default pagination', async () => {
      const req = new NextRequest('http://localhost/api/admin/jobs');
      const mockData = {
        items: [
          { id: 'j1', type: 'EMAIL', status: 'COMPLETED', queue: 'default' },
        ],
        total: 1,
      };
      mockService.listJobs.mockResolvedValue(mockData);

      const res = await JobController.list(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockData);
      expect(mockService.listJobs).toHaveBeenCalledWith({ page: 1, limit: 20, status: undefined, type: undefined });
    });

    it('should filter jobs by status and type', async () => {
      const req = new NextRequest('http://localhost/api/admin/jobs?status=FAILED&type=REPORT&page=1&limit=10');
      const mockData = { items: [], total: 0 };
      mockService.listJobs.mockResolvedValue(mockData);

      const res = await JobController.list(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(mockService.listJobs).toHaveBeenCalledWith({ page: 1, limit: 10, status: 'FAILED', type: 'REPORT' });
    });
  });

  describe('retry', () => {
    it('should retry a failed job', async () => {
      const req = new NextRequest('http://localhost/api/admin/jobs/j1/retry', {
        method: 'POST',
      });
      const mockJob = { id: 'j1', status: 'PENDING', attempts: 0, retryAt: new Date() };
      mockService.retryJob.mockResolvedValue(mockJob);

      const res = await JobController.retry(req, 'j1');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('PENDING');
      expect(mockService.retryJob).toHaveBeenCalledWith('j1');
    });

    it('should retry a job and reset attempts', async () => {
      const req = new NextRequest('http://localhost/api/admin/jobs/j2/retry');
      const mockJob = { id: 'j2', status: 'PENDING', attempts: 0, failedAt: null };
      mockService.retryJob.mockResolvedValue(mockJob);

      const res = await JobController.retry(req, 'j2');
      const body = await res.json();

      expect(body.data.attempts).toBe(0);
      expect(body.data.failedAt).toBeNull();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending job', async () => {
      const req = new NextRequest('http://localhost/api/admin/jobs/j1', {
        method: 'DELETE',
      });
      const mockJob = { id: 'j1', status: 'CANCELLED' };
      mockService.cancelJob.mockResolvedValue(mockJob);

      const res = await JobController.cancel(req, 'j1');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('CANCELLED');
      expect(mockService.cancelJob).toHaveBeenCalledWith('j1');
    });
  });
});

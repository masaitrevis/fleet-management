import { JobRepository } from '../repositories/job.repository';
import { MockQueueProvider } from '../providers/queue.provider';

export class JobService {
  private repo = new JobRepository();
  private queue = new MockQueueProvider();

  async listJobs(params: { page: number; limit: number; status?: string; type?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    return this.repo.findAll({
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async retryJob(id: string) {
    const job = await this.repo.findById(id);
    if (!job) throw new Error('Job not found');

    await this.queue.retryJob(job.queue, job.id);
    return this.repo.update(id, {
      status: 'PENDING',
      attempts: 0,
      retryAt: new Date(),
      failedAt: null,
    });
  }

  async cancelJob(id: string) {
    const job = await this.repo.findById(id);
    if (!job) throw new Error('Job not found');

    await this.queue.cancelJob(job.queue, job.id);
    return this.repo.update(id, { status: 'CANCELLED' });
  }
}

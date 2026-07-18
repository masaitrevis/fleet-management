export interface QueueProvider {
  getQueueStats(queue: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;
  retryJob(queue: string, jobId: string): Promise<{ success: boolean }>;
  cancelJob(queue: string, jobId: string): Promise<{ success: boolean }>;
  getWorkers(): Promise<Array<{ id: string; queue: string; status: string; lastActivity: Date }>>;
}

export class MockQueueProvider implements QueueProvider {
  async getQueueStats(queue: string) {
    return {
      pending: Math.floor(Math.random() * 50),
      processing: Math.floor(Math.random() * 10),
      completed: Math.floor(Math.random() * 1000),
      failed: Math.floor(Math.random() * 20),
      delayed: Math.floor(Math.random() * 5),
    };
  }

  async retryJob(_queue: string, _jobId: string) {
    return { success: true };
  }

  async cancelJob(_queue: string, _jobId: string) {
    return { success: true };
  }

  async getWorkers() {
    return [
      { id: 'worker-1', queue: 'default', status: 'active', lastActivity: new Date() },
      { id: 'worker-2', queue: 'emails', status: 'active', lastActivity: new Date() },
      { id: 'worker-3', queue: 'reports', status: 'idle', lastActivity: new Date(Date.now() - 300000) },
    ];
  }
}

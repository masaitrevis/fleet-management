import { MockMonitoringProvider } from '../providers/monitoring.provider';
import { MonitoringData } from '../types';

export class MonitoringService {
  private provider = new MockMonitoringProvider();

  async getMonitoringData(): Promise<MonitoringData> {
    const [cpu, memory, disk, dbConnections, apiTimes] = await Promise.all([
      this.provider.getCPUUsage(),
      this.provider.getMemoryUsage(),
      this.provider.getDiskUsage(),
      this.provider.getDBConnections(),
      this.provider.getAPIResponseTimes(),
    ]);

    return {
      cpuUsage: cpu.usage,
      memoryUsage: memory.percentage,
      diskUsage: disk.percentage,
      dbConnections: dbConnections.active,
      dbConnectionLimit: dbConnections.max,
      apiResponseTimeAvg: apiTimes.avg,
      apiRequestsPerMinute: Math.floor(Math.random() * 500) + 100,
      errorRate: Math.random() * 2,
      uptime: 99.9,
      timestamps: Array.from({ length: 10 }, (_, i) => new Date(Date.now() - (9 - i) * 60000)),
    };
  }
}

export interface MonitoringProvider {
  getCPUUsage(): Promise<{ usage: number; cores: number }>;
  getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }>;
  getDiskUsage(): Promise<{ used: number; total: number; percentage: number }>;
  getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number; connections: number }>;
  getDBConnections(): Promise<{ active: number; idle: number; max: number }>;
  getAPIResponseTimes(): Promise<{ avg: number; p50: number; p95: number; p99: number }>;
}

export class MockMonitoringProvider implements MonitoringProvider {
  async getCPUUsage() {
    return { usage: Math.random() * 60 + 10, cores: 4 };
  }

  async getMemoryUsage() {
    const total = 16 * 1024 * 1024 * 1024;
    const used = total * (Math.random() * 0.5 + 0.2);
    return { used, total, percentage: (used / total) * 100 };
  }

  async getDiskUsage() {
    const total = 500 * 1024 * 1024 * 1024;
    const used = total * (Math.random() * 0.4 + 0.3);
    return { used, total, percentage: (used / total) * 100 };
  }

  async getNetworkStats() {
    return {
      bytesIn: Math.floor(Math.random() * 1000000),
      bytesOut: Math.floor(Math.random() * 1000000),
      connections: Math.floor(Math.random() * 500) + 50,
    };
  }

  async getDBConnections() {
    const max = 100;
    const active = Math.floor(Math.random() * 30) + 5;
    return { active, idle: Math.floor(Math.random() * 10), max };
  }

  async getAPIResponseTimes() {
    const avg = Math.random() * 150 + 50;
    return { avg, p50: avg * 0.8, p95: avg * 2, p99: avg * 3 };
  }
}

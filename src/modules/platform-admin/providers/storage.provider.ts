export interface StorageProvider {
  getStorageUsage(): Promise<{ total: number; used: number; free: number }>;
  getStorageByTenant(companyId: string): Promise<{ used: number; files: number }>;
}

export class MockStorageProvider implements StorageProvider {
  async getStorageUsage() {
    const total = 1024 * 1024 * 1024 * 1024; // 1TB
    const used = total * (Math.random() * 0.4 + 0.2);
    return { total, used, free: total - used };
  }

  async getStorageByTenant(_companyId: string) {
    return { used: Math.floor(Math.random() * 10 * 1024 * 1024 * 1024), files: Math.floor(Math.random() * 10000) };
  }
}

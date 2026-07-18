export interface BackupProvider {
  createBackup(type: string, metadata?: Record<string, unknown>): Promise<{ id: string; path: string; size: number }>;
  listBackups(): Promise<Array<{ id: string; path: string; size: number; createdAt: Date; status: string }>>;
  restoreBackup(id: string): Promise<{ success: boolean; message: string }>;
  deleteBackup(id: string): Promise<{ success: boolean }>;
}

export class MockBackupProvider implements BackupProvider {
  private backups: Array<{ id: string; path: string; size: number; createdAt: Date; status: string }> = [];

  async createBackup(type: string, metadata?: Record<string, unknown>) {
    const id = `backup_${Date.now()}`;
    const path = `/backups/${type}/${id}.sql.gz`;
    const size = Math.floor(Math.random() * 500 * 1024 * 1024) + 10 * 1024 * 1024;
    const backup = { id, path, size, createdAt: new Date(), status: 'COMPLETED' };
    this.backups.push(backup);
    return { id, path, size };
  }

  async listBackups() {
    return this.backups;
  }

  async restoreBackup(id: string) {
    const backup = this.backups.find((b) => b.id === id);
    if (!backup) throw new Error('Backup not found');
    return { success: true, message: `Backup ${id} restored successfully` };
  }

  async deleteBackup(id: string) {
    this.backups = this.backups.filter((b) => b.id !== id);
    return { success: true };
  }
}

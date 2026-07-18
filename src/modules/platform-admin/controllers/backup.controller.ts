import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '../services/backup.service';

export class BackupController {
  private static service = new BackupService();

  static async list(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || undefined;
    const result = await BackupController.service.listBackups({ page, limit, status });
    return NextResponse.json({ success: true, data: result });
  }

  static async create(req: NextRequest) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const body = await req.json();
    const record = await BackupController.service.triggerBackup(body.type || 'MANUAL', adminId);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  }
}

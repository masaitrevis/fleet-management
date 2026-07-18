import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '../services/audit-log.service';

export class AuditLogController {
  private static service = new AuditLogService();

  static async list(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const userId = url.searchParams.get('userId') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const entityType = url.searchParams.get('entityType') || undefined;
    const result = await AuditLogController.service.listLogs({ page, limit, userId, action, entityType });
    return NextResponse.json({ success: true, data: result });
  }
}

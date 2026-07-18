import { NextRequest, NextResponse } from 'next/server';
import { SystemConfigService } from '../services/system-config.service';
import { UpdateSystemConfigSchema } from '../dto';

export class SystemConfigController {
  private static service = new SystemConfigService();

  static async getAll(req: NextRequest) {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || undefined;
    const config = await SystemConfigController.service.getAllConfig(category);
    return NextResponse.json({ success: true, data: config });
  }

  static async update(req: NextRequest) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const body = await req.json();
    const data = UpdateSystemConfigSchema.parse(body);
    const config = await SystemConfigController.service.updateConfig(data, adminId);
    return NextResponse.json({ success: true, data: config });
  }
}

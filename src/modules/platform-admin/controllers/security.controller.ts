import { NextRequest, NextResponse } from 'next/server';
import { SecurityService } from '../services/security.service';
import { BlockIPSchema, ResolveSecurityEventSchema } from '../dto';

export class SecurityController {
  private static service = new SecurityService();

  static async getDashboard(_req: NextRequest) {
    const data = await SecurityController.service.getDashboardData();
    return NextResponse.json({ success: true, data });
  }

  static async listEvents(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const severity = url.searchParams.get('severity') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const result = await SecurityController.service.listEvents({ page, limit, severity, type });
    return NextResponse.json({ success: true, data: result });
  }

  static async resolveEvent(req: NextRequest, id: string) {
    const body = await req.json();
    const data = ResolveSecurityEventSchema.parse(body);
    const event = await SecurityController.service.resolveEvent(id, data.resolvedBy);
    return NextResponse.json({ success: true, data: event });
  }

  static async blockIP(req: NextRequest) {
    const body = await req.json();
    const data = BlockIPSchema.parse(body);
    return NextResponse.json({
      success: true,
      data: { ipAddress: data.ipAddress, blocked: true, reason: data.reason },
    });
  }

  static async unblockIP(req: NextRequest) {
    const url = new URL(req.url);
    const ip = url.searchParams.get('ip');
    return NextResponse.json({
      success: true,
      data: { ipAddress: ip, blocked: false },
    });
  }
}

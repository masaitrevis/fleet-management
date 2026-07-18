import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '../services/report.service';

export class ReportController {
  private static service = new ReportService();

  static async getUsageReport(_req: NextRequest) {
    const data = await ReportController.service.getUsageReport();
    return NextResponse.json({ success: true, data });
  }

  static async getRevenueReport(_req: NextRequest) {
    const data = await ReportController.service.getRevenueReport();
    return NextResponse.json({ success: true, data });
  }

  static async getSecurityReport(_req: NextRequest) {
    const data = await ReportController.service.getSecurityReport();
    return NextResponse.json({ success: true, data });
  }
}

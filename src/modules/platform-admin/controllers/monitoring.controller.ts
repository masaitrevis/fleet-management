import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '../services/monitoring.service';

export class MonitoringController {
  private static service = new MonitoringService();

  static async getMetrics(_req: NextRequest) {
    const data = await MonitoringController.service.getMonitoringData();
    return NextResponse.json({ success: true, data });
  }
}

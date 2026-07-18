import { NextRequest, NextResponse } from 'next/server';
import { AdminDashboardService } from '../services/admin-dashboard.service';

export class AdminDashboardController {
  private static service = new AdminDashboardService();

  static async getDashboardMetrics(req: NextRequest) {
    const metrics = await AdminDashboardController.service.getMetrics();
    return NextResponse.json({ success: true, data: metrics });
  }
}

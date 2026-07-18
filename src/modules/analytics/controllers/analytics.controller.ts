import { NextRequest, NextResponse } from 'next/server';
import { KPICalculator } from '../engine/kpi-calculator';

export class AnalyticsController {
  static async getDashboardKPIs(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const kpi = new KPICalculator(companyId);
      const data = await kpi.getAllKPIs(dateRange);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getFleetKPIs(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const kpi = new KPICalculator(companyId);
      const data = await kpi.getFleetKPIs(dateRange);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getDriverKPIs(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const kpi = new KPICalculator(companyId);
      const data = await kpi.getDriverKPIs(dateRange);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getFuelKPIs(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const kpi = new KPICalculator(companyId);
      const data = await kpi.getFuelKPIs(dateRange);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getMaintenanceKPIs(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const kpi = new KPICalculator(companyId);
      const data = await kpi.getMaintenanceKPIs(dateRange);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getComplianceKPIs(req: NextRequest, companyId: string) {
    try {
      const kpi = new KPICalculator(companyId);
      const data = await kpi.getComplianceKPIs();

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getFinancialKPIs(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const kpi = new KPICalculator(companyId);
      const data = await kpi.getFinancialKPIs(dateRange);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

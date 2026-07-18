import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '../services/report.service';
import { ReportType, ReportCategory, ReportFormat } from '@prisma/client';

export class ReportController {
  static async generate(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const { type, category, name, filters, format } = body;

      const service = new ReportService(companyId);
      const report = await service.generateReport(
        type as ReportType,
        category as ReportCategory,
        name,
        filters,
        (format as ReportFormat) || ReportFormat.JSON
      );

      return NextResponse.json({ success: true, data: report }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async list(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') as ReportType | undefined;
      const category = searchParams.get('category') as ReportCategory | undefined;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const service = new ReportService(companyId);
      const result = await service.getReports(type, category, page, limit);

      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getById(req: NextRequest, companyId: string, id: string) {
    try {
      const service = new ReportService(companyId);
      const report = await service.getReportById(id);
      if (!report) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

      return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async delete(req: NextRequest, companyId: string, id: string) {
    try {
      const service = new ReportService(companyId);
      await service.deleteReport(id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

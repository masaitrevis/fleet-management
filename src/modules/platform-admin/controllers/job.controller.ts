import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '../services/job.service';

export class JobController {
  private static service = new JobService();

  static async list(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const result = await JobController.service.listJobs({ page, limit, status, type });
    return NextResponse.json({ success: true, data: result });
  }

  static async retry(req: NextRequest, id: string) {
    const job = await JobController.service.retryJob(id);
    return NextResponse.json({ success: true, data: job });
  }

  static async cancel(_req: NextRequest, id: string) {
    const job = await JobController.service.cancelJob(id);
    return NextResponse.json({ success: true, data: job });
  }
}

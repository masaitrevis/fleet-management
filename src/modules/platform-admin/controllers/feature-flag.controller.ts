import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlagService } from '../services/feature-flag.service';
import { CreateFeatureFlagSchema, UpdateFeatureFlagSchema } from '../dto';

export class FeatureFlagController {
  private static service = new FeatureFlagService();

  static async list(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const companyId = url.searchParams.get('companyId') || undefined;
    const result = await FeatureFlagController.service.listFlags({ page, limit, companyId });
    return NextResponse.json({ success: true, data: result });
  }

  static async create(req: NextRequest) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const body = await req.json();
    const data = CreateFeatureFlagSchema.parse(body);
    const flag = await FeatureFlagController.service.createFlag(data, adminId);
    return NextResponse.json({ success: true, data: flag }, { status: 201 });
  }

  static async update(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const body = await req.json();
    const data = UpdateFeatureFlagSchema.parse(body);
    const flag = await FeatureFlagController.service.updateFlag(id, data, adminId);
    return NextResponse.json({ success: true, data: flag });
  }

  static async delete(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const result = await FeatureFlagController.service.deleteFlag(id, adminId);
    return NextResponse.json({ success: true, data: result });
  }
}

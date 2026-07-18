import { NextRequest, NextResponse } from 'next/server';
import { PlatformUserService } from '../services/platform-user.service';
import { CreatePlatformUserSchema, UpdatePlatformUserSchema } from '../dto';

export class PlatformUserController {
  private static service = new PlatformUserService();

  static async list(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || undefined;
    const result = await PlatformUserController.service.listUsers({ page, limit, search });
    return NextResponse.json({ success: true, data: result });
  }

  static async create(req: NextRequest) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const body = await req.json();
    const data = CreatePlatformUserSchema.parse(body);
    const user = await PlatformUserController.service.createUser(data, adminId);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  }

  static async getById(_req: NextRequest, id: string) {
    const user = await PlatformUserController.service.getUser(id);
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user });
  }

  static async update(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const body = await req.json();
    const data = UpdatePlatformUserSchema.parse(body);
    const user = await PlatformUserController.service.updateUser(id, data, adminId);
    return NextResponse.json({ success: true, data: user });
  }

  static async delete(req: NextRequest, id: string) {
    const adminId = req.headers.get('x-admin-id') || undefined;
    const user = await PlatformUserController.service.deleteUser(id, adminId);
    return NextResponse.json({ success: true, data: user });
  }
}

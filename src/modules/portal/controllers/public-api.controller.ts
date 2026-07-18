import { NextRequest, NextResponse } from 'next/server';
import { PublicApiService } from '../services/public-api.service';
import { prisma } from '@/lib/prisma';

const publicApiService = new PublicApiService();

export class PublicApiController {
  /**
   * Middleware helper to validate API key
   */
  static async validateRequest(req: NextRequest): Promise<{ companyId: string; permissions: string[] } | null> {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) return null;

    const result = await publicApiService.validateApiKey(apiKey);
    if (!result.valid || !result.companyId) return null;

    // Check rate limit
    const apiKeyRecord = await prisma.aPIKey.findFirst({
      where: { keyPrefix: apiKey.slice(0, 8) },
    });
    if (apiKeyRecord) {
      const rateLimit = await publicApiService.checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimit);
      if (!rateLimit.allowed) return null;
    }

    return { companyId: result.companyId, permissions: result.permissions || [] };
  }

  // ==================== TRIPS ====================
  static async getTrips(req: NextRequest) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const status = searchParams.get('status') || undefined;

      const where: any = { companyId: auth.companyId, deletedAt: null };
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        prisma.trip.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.trip.count({ where }),
      ]);

      return NextResponse.json({ success: true, data: { items, total, page, limit } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getTripById(req: NextRequest, id: string) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const trip = await prisma.trip.findFirst({
        where: { id, companyId: auth.companyId, deletedAt: null },
        include: { vehicle: true, driver: true, tripStops: true },
      });
      if (!trip) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: trip });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== VEHICLES ====================
  static async getVehicles(req: NextRequest) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

      const where = { companyId: auth.companyId, deletedAt: null };
      const [items, total] = await Promise.all([
        prisma.vehicle.findMany({ where, skip: (page - 1) * limit, take: limit }),
        prisma.vehicle.count({ where }),
      ]);

      return NextResponse.json({ success: true, data: { items, total, page, limit } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getVehicleLocation(req: NextRequest, id: string) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const location = await prisma.vehicleLocation.findFirst({
        where: { vehicleId: id, companyId: auth.companyId },
        orderBy: { timestamp: 'desc' },
      });
      if (!location) return NextResponse.json({ success: false, error: 'No location data' }, { status: 404 });
      return NextResponse.json({ success: true, data: location });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== DRIVERS ====================
  static async getDrivers(req: NextRequest) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

      const where = { companyId: auth.companyId, deletedAt: null };
      const [items, total] = await Promise.all([
        prisma.driver.findMany({ where, skip: (page - 1) * limit, take: limit }),
        prisma.driver.count({ where }),
      ]);

      return NextResponse.json({ success: true, data: { items, total, page, limit } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== WEBHOOKS ====================
  static async registerWebhook(req: NextRequest) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const body = await req.json();
      const webhook = await prisma.webhook.create({
        data: {
          companyId: auth.companyId,
          name: body.name,
          url: body.url,
          secret: body.secret || crypto.randomUUID(),
          events: body.events || [],
          status: 'ACTIVE',
        },
      });
      return NextResponse.json({ success: true, data: webhook }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getWebhooks(req: NextRequest) {
    const auth = await this.validateRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
      const webhooks = await publicApiService.getWebhooks(auth.companyId);
      return NextResponse.json({ success: true, data: webhooks });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

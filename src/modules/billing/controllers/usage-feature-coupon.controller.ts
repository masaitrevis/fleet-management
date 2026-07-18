import { NextRequest, NextResponse } from 'next/server';
import { UsageMonitoringService, ResourceType } from '../services/usage-monitoring.service';

export class UsageController {
  static async getAll(req: NextRequest, companyId: string) {
    try {
      const service = new UsageMonitoringService(companyId);
      const usage = await service.getAllUsage();
      return NextResponse.json({ success: true, data: usage });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getByResource(req: NextRequest, companyId: string, resourceType: string) {
    try {
      const service = new UsageMonitoringService(companyId);
      const usage = await service.getUsage(resourceType as ResourceType);
      return NextResponse.json({ success: true, data: usage });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async checkLimit(req: NextRequest, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const resourceType = searchParams.get('resourceType') as ResourceType;
      if (!resourceType) return NextResponse.json({ success: false, error: 'resourceType required' }, { status: 400 });

      const service = new UsageMonitoringService(companyId);
      const check = await service.checkLimit(resourceType);
      return NextResponse.json({ success: true, data: check });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async syncLimits(req: NextRequest, companyId: string) {
    try {
      const service = new UsageMonitoringService(companyId);
      await service.syncLimits();
      return NextResponse.json({ success: true, message: 'Limits synced' });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

export class FeatureController {
  static async getAll(req: NextRequest, companyId: string) {
    try {
      const { FeatureFlagService } = await import('../services/feature-flag.service');
      const service = new FeatureFlagService(companyId);
      const flags = await service.getFeatureFlags();
      return NextResponse.json({ success: true, data: flags });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getStatus(req: NextRequest, companyId: string) {
    try {
      const { FeatureFlagService } = await import('../services/feature-flag.service');
      const service = new FeatureFlagService(companyId);
      const status = await service.getFeatureStatus();
      return NextResponse.json({ success: true, data: status });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async checkFeature(req: NextRequest, companyId: string, featureKey: string) {
    try {
      const { FeatureFlagService } = await import('../services/feature-flag.service');
      const service = new FeatureFlagService(companyId);
      const enabled = await service.isEnabled(featureKey);
      return NextResponse.json({ success: true, data: { featureKey, enabled } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async toggleFeature(req: NextRequest, companyId: string, featureKey: string) {
    try {
      const { FeatureFlagService } = await import('../services/feature-flag.service');
      const service = new FeatureFlagService(companyId);
      const result = await service.toggle(featureKey);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

export class CouponController {
  static async getAll(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const { CouponService } = await import('../services/coupon.service');
      const service = new CouponService();
      const result = await service.getCoupons(page, limit);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async validate(req: NextRequest) {
    try {
      const body = await req.json();
      const { CouponService } = await import('../services/coupon.service');
      const service = new CouponService();
      const result = await service.validateCoupon(body.code, body.planSlug, body.amount);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async create(req: NextRequest, companyId: string) {
    try {
      const body = await req.json();
      const { CouponService } = await import('../services/coupon.service');
      const service = new CouponService(companyId);
      const coupon = await service.createCoupon(body);
      return NextResponse.json({ success: true, data: coupon }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

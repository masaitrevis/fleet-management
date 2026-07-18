import { NextRequest, NextResponse } from 'next/server';
import { CustomerAuthService } from '../services/customer-auth.service';
import { CustomerPortalService } from '../services/customer-portal.service';

export class CustomerAuthController {
  static async login(req: NextRequest) {
    try {
      const body = await req.json();
      const service = new CustomerAuthService();
      const result = await service.login(body.email, body.password, body.companyId);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
  }

  static async refresh(req: NextRequest) {
    try {
      const body = await req.json();
      const service = new CustomerAuthService();
      const result = await service.refresh(body.refreshToken);
      return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
  }

  static async logout(req: NextRequest, customerId: string) {
    try {
      const service = new CustomerAuthService();
      await service.logout(customerId);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async changePassword(req: NextRequest, customerId: string) {
    try {
      const body = await req.json();
      const service = new CustomerAuthService();
      await service.changePassword(customerId, body.oldPassword, body.newPassword);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }
}

export class CustomerPortalController {
  static async getDashboard(req: NextRequest, customerId: string, companyId: string) {
    try {
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getDashboardSummary();
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getShipments(req: NextRequest, customerId: string, companyId: string) {
    try {
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getActiveShipments();
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getHistory(req: NextRequest, customerId: string, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getDeliveryHistory(page, limit);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getTracking(req: NextRequest, customerId: string, companyId: string, tripId: string) {
    try {
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getShipmentTracking(tripId);
      if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getLiveLocation(req: NextRequest, customerId: string, companyId: string, tripId: string) {
    try {
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getLiveLocation(tripId);
      if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getInvoices(req: NextRequest, customerId: string, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getInvoices(page, limit);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async submitSupport(req: NextRequest, customerId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.submitSupportRequest(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getProfile(req: NextRequest, customerId: string, companyId: string) {
    try {
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.getProfile();
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async updateProfile(req: NextRequest, customerId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new CustomerPortalService(customerId, companyId);
      const data = await service.updateProfile(body);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

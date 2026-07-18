import { NextRequest, NextResponse } from 'next/server';
import { MobileDriverService } from '../services/mobile-driver.service';
import { MobileSyncService } from '../services/mobile-sync.service';

export class MobileDriverController {
  // ==================== TRIPS ====================
  static async getTrips(req: NextRequest, driverId: string, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || undefined;
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.getAssignedTrips(status);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.getTripById(tripId);
      if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async acceptTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.acceptTrip(tripId);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async rejectTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.rejectTrip(tripId, body.reason);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async startTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.startTrip(tripId, body.odometer);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async pauseTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.pauseTrip(tripId, body.reason);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async resumeTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.resumeTrip(tripId);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async completeTrip(req: NextRequest, driverId: string, companyId: string, tripId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.completeTrip(tripId, body.odometer, body.notes);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== GPS ====================
  static async saveLocation(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.saveLocation(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async saveLocationBatch(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.saveLocationBatch(body.locations);
      return NextResponse.json({ success: true, data: { count: data.count } }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== VEHICLE ====================
  static async getVehicle(req: NextRequest, driverId: string, companyId: string) {
    try {
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.getAssignedVehicle();
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async submitChecklist(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.submitVehicleChecklist(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async reportIssue(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.reportVehicleIssue(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== FUEL ====================
  static async submitFuel(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.submitFuelLog(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== MAINTENANCE ====================
  static async reportBreakdown(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.reportBreakdown(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== INSPECTION ====================
  static async submitInspection(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.submitDailyInspection(body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== NOTIFICATIONS ====================
  static async getNotifications(req: NextRequest, driverId: string, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.getNotifications(page, limit);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async markNotificationRead(req: NextRequest, driverId: string, companyId: string, notificationId: string) {
    try {
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.markNotificationRead(notificationId);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== PROFILE ====================
  static async getProfile(req: NextRequest, driverId: string, companyId: string) {
    try {
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.getProfile();
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async updateProfile(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.updateProfile(body);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== EMERGENCY ====================
  static async emergencySOS(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileDriverService(driverId, companyId);
      const data = await service.sendEmergencySOS(body.location, body.reason);
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // ==================== SYNC ====================
  static async sync(req: NextRequest, driverId: string, companyId: string) {
    try {
      const body = await req.json();
      const service = new MobileSyncService(driverId, companyId);
      const data = await service.processSyncBatch(body.operations);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  static async getSyncState(req: NextRequest, driverId: string, companyId: string) {
    try {
      const { searchParams } = new URL(req.url);
      const lastSync = searchParams.get('lastSync');
      const service = new MobileSyncService(driverId, companyId);
      const data = await service.getSyncState(lastSync ? new Date(lastSync) : undefined);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

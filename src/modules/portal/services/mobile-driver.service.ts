import { prisma } from '@/lib/prisma';
import { TripStatus } from '@prisma/client';

export class MobileDriverService {
  constructor(private driverId: string, private companyId: string) {}

  // ==================== TRIPS ====================

  async getAssignedTrips(status?: string) {
    const where: any = {
      companyId: this.companyId,
      driverId: this.driverId,
      deletedAt: null,
    };
    if (status) where.status = status;

    return prisma.trip.findMany({
      where,
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true, color: true } },
        customer: { select: { id: true, name: true, phone: true } },
        route: { select: { id: true, name: true, distance: true, estimatedDuration: true } },
        tripStops: { orderBy: { stopOrder: 'asc' } },
        tripCargos: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getTripById(tripId: string) {
    return prisma.trip.findFirst({
      where: {
        id: tripId,
        companyId: this.companyId,
        driverId: this.driverId,
        deletedAt: null,
      },
      include: {
        vehicle: true,
        customer: true,
        route: true,
        tripStops: { orderBy: { stopOrder: 'asc' } },
        tripCargos: true,
        tripChecklists: true,
      },
    });
  }

  async acceptTrip(tripId: string) {
    return this.updateTripStatus(tripId, 'ASSIGNED');
  }

  async rejectTrip(tripId: string, reason?: string) {
    return prisma.trip.update({
      where: { id: tripId, companyId: this.companyId, driverId: this.driverId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'Driver rejected',
        cancelledAt: new Date(),
        cancelledBy: this.driverId,
      },
    });
  }

  async startTrip(tripId: string, odometer?: number) {
    const data: any = {
      status: 'IN_PROGRESS',
      actualStartTime: new Date(),
    };
    if (odometer !== undefined) data.startOdometer = odometer;

    const trip = await prisma.trip.update({
      where: { id: tripId, companyId: this.companyId, driverId: this.driverId },
      data,
    });

    // Add timeline entry
    await prisma.tripTimeline.create({
      data: {
        companyId: this.companyId,
        tripId,
        eventType: 'STARTED',
        eventTime: new Date(),
        notes: `Odometer: ${odometer || 'N/A'}`,
      },
    });

    return trip;
  }

  async pauseTrip(tripId: string, reason?: string) {
    const trip = await prisma.trip.update({
      where: { id: tripId, companyId: this.companyId, driverId: this.driverId },
      data: { status: 'SCHEDULED' },
    });

    await prisma.tripTimeline.create({
      data: {
        companyId: this.companyId,
        tripId,
        eventType: 'PAUSED',
        eventTime: new Date(),
        notes: reason,
      },
    });

    return trip;
  }

  async resumeTrip(tripId: string) {
    const trip = await prisma.trip.update({
      where: { id: tripId, companyId: this.companyId, driverId: this.driverId },
      data: { status: 'IN_PROGRESS' },
    });

    await prisma.tripTimeline.create({
      data: {
        companyId: this.companyId,
        tripId,
        eventType: 'RESUMED',
        eventTime: new Date(),
      },
    });

    return trip;
  }

  async completeTrip(tripId: string, odometer?: number, notes?: string) {
    const data: any = {
      status: 'COMPLETED',
      actualEndTime: new Date(),
    };
    if (odometer !== undefined) data.endOdometer = odometer;
    if (notes) data.notes = notes;

    const trip = await prisma.trip.update({
      where: { id: tripId, companyId: this.companyId, driverId: this.driverId },
      data,
    });

    await prisma.tripTimeline.create({
      data: {
        companyId: this.companyId,
        tripId,
        eventType: 'COMPLETED',
        eventTime: new Date(),
        notes: `Odometer: ${odometer || 'N/A'}`,
      },
    });

    return trip;
  }

  // ==================== GPS ====================

  async saveLocation(data: {
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp?: Date;
    batteryLevel?: number;
    isMoving?: boolean;
  }) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new Error('No vehicle assigned to driver');
    }

    return prisma.vehicleLocation.create({
      data: {
        companyId: this.companyId,
        vehicleId: vehicle.id,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.accuracy,
        timestamp: data.timestamp || new Date(),
        batteryLevel: data.batteryLevel,
      },
    });
  }

  async saveLocationBatch(locations: Array<{
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp?: Date;
  }>) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new Error('No vehicle assigned to driver');
    }

    const data = locations.map((loc) => ({
      companyId: this.companyId,
      vehicleId: vehicle.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      altitude: loc.altitude,
      speed: loc.speed,
      heading: loc.heading,
      accuracy: loc.accuracy,
      timestamp: loc.timestamp || new Date(),
    }));

    return prisma.vehicleLocation.createMany({ data });
  }

  // ==================== VEHICLE ====================

  async getAssignedVehicle() {
    return prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId, deletedAt: null },
      include: {
        type: true,
        vehicleDocuments: { where: { deletedAt: null } },
      },
    });
  }

  async submitVehicleChecklist(data: {
    tripId: string;
    items: Array<{ item: string; status: 'PASS' | 'FAIL' | 'NA'; notes?: string }>;
    odometer?: number;
    fuelLevel?: number;
  }) {
    const checklistItems = data.items.map((i, idx) => ({
      companyId: this.companyId,
      tripId: data.tripId,
      item: i.item,
      isRequired: true,
      isCompleted: i.status === 'PASS',
      notes: i.notes,
    }));

    await prisma.tripChecklist.createMany({ data: checklistItems });
    return { count: checklistItems.length };
  }

  async reportVehicleIssue(data: {
    vehicleId: string;
    issue: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    photos?: string[];
  }) {
    return prisma.maintenanceRecord.create({
      data: {
        companyId: this.companyId,
        vehicleId: data.vehicleId,
        serviceDate: new Date(),
        status: 'SCHEDULED',
        priority: data.severity as any,
        description: data.issue,
        workPerformed: `Reported by driver ${this.driverId}`,
      },
    });
  }

  // ==================== FUEL ====================

  async submitFuelLog(data: {
    tripId?: string;
    fuelStationId?: string;
    liters: number;
    cost: number;
    odometer: number;
    fuelType?: string;
    receiptUrl?: string;
    notes?: string;
  }) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new Error('No vehicle assigned');
    }

    return prisma.fuelLog.create({
      data: {
        companyId: this.companyId,
        vehicleId: vehicle.id,
        driverId: this.driverId,
        tripId: data.tripId,
        fuelStationId: data.fuelStationId,
        quantity: data.liters || 0,
        totalCost: data.cost || 0,
        pricePerUnit: data.cost && data.liters ? data.cost / data.liters : 0,
        odometerReading: data.odometer,
        fuelType: (data.fuelType || 'DIESEL') as any,
        receiptUrl: data.receiptUrl,
        fuelDate: new Date(),
        notes: data.notes,
      },
    });
  }

  // ==================== MAINTENANCE ====================

  async reportBreakdown(data: {
    vehicleId: string;
    description: string;
    location?: string;
    photos?: string[];
  }) {
    return prisma.maintenanceRecord.create({
      data: {
        companyId: this.companyId,
        vehicleId: data.vehicleId,
        serviceDate: new Date(),
        status: 'SCHEDULED',
        priority: 'CRITICAL',
        description: data.description,
        workPerformed: `Breakdown reported by driver ${this.driverId}. Location: ${data.location || 'Unknown'}`,
      },
    });
  }

  // ==================== INSPECTION ====================

  async submitDailyInspection(data: {
    vehicleId: string;
    items: Array<{ category: string; item: string; status: 'PASS' | 'FAIL' | 'NA'; notes?: string }>;
    photos?: string[];
    notes?: string;
  }) {
    const passCount = data.items.filter((i) => i.status === 'PASS').length;
    const failCount = data.items.filter((i) => i.status === 'FAIL').length;
    const result = failCount === 0 ? 'PASS' : failCount > 2 ? 'FAIL' : 'CONDITIONAL';

    return prisma.inspection.create({
      data: {
        companyId: this.companyId,
        vehicleId: data.vehicleId,
        inspectionType: 'DAILY',
        inspectionDate: new Date(),
        nextInspectionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        result: result as any,
        score: Math.round((passCount / data.items.length) * 100),
        notes: data.notes,
      },
    });
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return prisma.notification.findMany({
      where: {
        companyId: this.companyId,
        userId: this.driverId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async markNotificationRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId, companyId: this.companyId },
      data: { readAt: new Date() },
    });
  }

  // ==================== PROFILE ====================

  async getProfile() {
    return prisma.driver.findUnique({
      where: { id: this.driverId },
      include: {
        currentVehicles: {
          select: { id: true, registrationNumber: true, make: true, model: true },
        },
      },
    });
  }

  async updateProfile(data: { phone?: string; emergencyContact?: string; address?: string }) {
    return prisma.driver.update({
      where: { id: this.driverId },
      data: {
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        address: data.address,
      },
    });
  }

  // ==================== EMERGENCY ====================

  async sendEmergencySOS(location: { latitude: number; longitude: number }, reason?: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: this.driverId },
      select: { firstName: true, lastName: true, phone: true },
    });

    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });

    const incident = await prisma.incident.create({
      data: {
        companyId: this.companyId,
        vehicleId: vehicle?.id,
        driverId: this.driverId,
        incidentNumber: `SOS-${Date.now()}`,
        incidentType: 'SAFETY_INCIDENT',
        severity: 'CRITICAL',
        status: 'OPEN',
        title: 'Emergency SOS',
        description: reason || 'Driver triggered emergency SOS',
        incidentDate: new Date(),
        location: `${location.latitude},${location.longitude}`,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });

    return incident;
  }

  // ==================== HELPERS ====================

  private async updateTripStatus(tripId: string, status: TripStatus) {
    return prisma.trip.update({
      where: { id: tripId, companyId: this.companyId, driverId: this.driverId },
      data: { status },
    });
  }
}

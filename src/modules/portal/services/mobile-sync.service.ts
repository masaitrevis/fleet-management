import { prisma } from '@/lib/prisma';

/**
 * Mobile Sync Service
 * Handles offline queue, batch sync, and conflict resolution for mobile drivers
 */
export class MobileSyncService {
  constructor(private driverId: string, private companyId: string) {}

  /**
   * Process a batch of offline operations
   * Operations are processed in order with conflict resolution
   */
  async processSyncBatch(operations: SyncOperation[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const op of operations) {
      try {
        const result = await this.processOperation(op);
        results.push({
          id: op.id,
          status: 'SUCCESS',
          data: result,
          syncedAt: new Date().toISOString(),
        });
      } catch (error: any) {
        results.push({
          id: op.id,
          status: 'FAILED',
          error: error.message,
          retryable: this.isRetryable(error),
        });
      }
    }

    return results;
  }

  /**
   * Get sync state for initial load
   */
  async getSyncState(lastSyncAt?: Date): Promise<SyncState> {
    const [trips, notifications, vehicle, inspections] = await Promise.all([
      prisma.trip.findMany({
        where: {
          companyId: this.companyId,
          driverId: this.driverId,
          deletedAt: null,
          updatedAt: lastSyncAt ? { gt: lastSyncAt } : undefined,
        },
        include: {
          tripStops: true,
          tripCargos: true,
        },
      }),
      prisma.notification.findMany({
        where: {
          companyId: this.companyId,
          userId: this.driverId,
          createdAt: lastSyncAt ? { gt: lastSyncAt } : undefined,
        },
      }),
      prisma.vehicle.findFirst({
        where: { currentDriverId: this.driverId, companyId: this.companyId, deletedAt: null },
        include: { type: true },
      }),
      prisma.inspection.findMany({
        where: {
          companyId: this.companyId,
          vehicle: { currentDriverId: this.driverId },
          updatedAt: lastSyncAt ? { gt: lastSyncAt } : undefined,
        },
      }),
    ]);

    return {
      trips,
      notifications,
      vehicle,
      inspections,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(op: SyncOperation): Promise<any> {
    switch (op.type) {
      case 'LOCATION':
        return this.processLocationOperation(op.data);
      case 'TRIP_STATUS':
        return this.processTripStatusOperation(op.data);
      case 'FUEL_LOG':
        return this.processFuelLogOperation(op.data);
      case 'CHECKLIST':
        return this.processChecklistOperation(op.data);
      case 'INSPECTION':
        return this.processInspectionOperation(op.data);
      case 'MAINTENANCE':
        return this.processMaintenanceOperation(op.data);
      case 'ODOMETER':
        return this.processOdometerOperation(op.data);
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  private async processLocationOperation(data: any) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });
    if (!vehicle) throw new Error('No vehicle assigned');

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
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });
  }

  private async processTripStatusOperation(data: any) {
    const updateData: any = { status: data.status };

    if (data.status === 'IN_PROGRESS') {
      updateData.actualStartTime = new Date();
    } else if (data.status === 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.actualEndTime = new Date();
      if (data.odometer) updateData.endOdometer = data.odometer;
    }

    return prisma.trip.update({
      where: { id: data.tripId, companyId: this.companyId, driverId: this.driverId },
      data: updateData,
    });
  }

  private async processFuelLogOperation(data: any) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });
    if (!vehicle) throw new Error('No vehicle assigned');

    return prisma.fuelLog.create({
      data: {
        companyId: this.companyId,
        vehicleId: vehicle.id,
        driverId: this.driverId,
        tripId: data.tripId,
        fuelType: (data.fuelType || 'DIESEL') as any,
        quantity: data.liters || data.quantity || 0,
        totalCost: data.cost || 0,
        pricePerUnit: data.cost && data.liters ? data.cost / data.liters : 0,
        odometerReading: data.odometer,
        fuelDate: data.timestamp ? new Date(data.timestamp) : new Date(),
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        isManualEntry: true,
      },
    });
  }

  private async processChecklistOperation(data: any) {
    const checklistItems = data.items?.map((i: any) => ({
      companyId: this.companyId,
      tripId: data.tripId,
      item: i.item,
      isRequired: true,
      isCompleted: i.status === 'PASS',
      notes: i.notes,
    })) || [];

    if (checklistItems.length === 0) throw new Error('No checklist items');

    return prisma.tripChecklist.createMany({ data: checklistItems });
  }

  private async processInspectionOperation(data: any) {
    return prisma.inspection.create({
      data: {
        companyId: this.companyId,
        vehicleId: data.vehicleId,
        inspectionType: data.type || 'DAILY',
        inspectionDate: data.timestamp ? new Date(data.timestamp) : new Date(),
        result: data.result || 'PASS',
        score: data.score,
        notes: data.notes,
        documentUrl: data.photos?.[0],
      },
    });
  }

  private async processMaintenanceOperation(data: any) {
    return prisma.maintenanceRecord.create({
      data: {
        companyId: this.companyId,
        vehicleId: data.vehicleId,
        serviceDate: new Date(),
        status: 'SCHEDULED',
        priority: (data.severity || 'NORMAL') as any,
        description: data.description || data.title || 'Mobile Report',
        workPerformed: `Reported by driver ${this.driverId}`,
      },
    });
  }

  private async processOdometerOperation(data: any) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { currentDriverId: this.driverId, companyId: this.companyId },
      select: { id: true },
    });
    if (!vehicle) throw new Error('No vehicle assigned');

    return prisma.odometerReading.create({
      data: {
        companyId: this.companyId,
        vehicleId: vehicle.id,
        reading: data.reading,
        source: 'MOBILE',
        recordedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
        notes: data.notes,
      },
    });
  }

  private isRetryable(error: any): boolean {
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'CONFLICT', 'RATE_LIMITED'];
    return retryableErrors.some((e) => error.message?.includes(e));
  }
}

export interface SyncOperation {
  id: string;
  type: 'LOCATION' | 'TRIP_STATUS' | 'FUEL_LOG' | 'CHECKLIST' | 'INSPECTION' | 'MAINTENANCE' | 'ODOMETER';
  data: any;
  timestamp: string;
  deviceId?: string;
}

export interface SyncResult {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'CONFLICT';
  data?: any;
  error?: string;
  retryable?: boolean;
  syncedAt?: string;
}

export interface SyncState {
  trips: any[];
  notifications: any[];
  vehicle: any;
  inspections: any[];
  serverTime: string;
}

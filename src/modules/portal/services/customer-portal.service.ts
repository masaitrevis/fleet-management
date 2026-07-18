import { prisma } from '@/lib/prisma';

export class CustomerPortalService {
  constructor(private customerId: string, private companyId: string) {}

  /**
   * Get active shipments for customer
   */
  async getActiveShipments() {
    return prisma.trip.findMany({
      where: {
        companyId: this.companyId,
        customerId: this.customerId,
        deletedAt: null,
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'SCHEDULED'] },
      },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, make: true, model: true, color: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true, photo: true } },
        tripStops: { orderBy: { stopOrder: 'asc' } },
        tripCargos: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Get delivery history
   */
  async getDeliveryHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.trip.findMany({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
        include: {
          vehicle: { select: { registrationNumber: true, make: true, model: true } },
          driver: { select: { firstName: true, lastName: true } },
          tripCargos: true,
        },
        skip,
        take: limit,
        orderBy: { actualEndTime: 'desc' },
      }),
      prisma.trip.count({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);
    return { items, total, page, limit };
  }

  /**
   * Get shipment tracking details
   */
  async getShipmentTracking(tripId: string) {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        companyId: this.companyId,
        customerId: this.customerId,
        deletedAt: null,
      },
      include: {
        vehicle: {
          select: {
            id: true, registrationNumber: true, make: true, model: true, color: true,
            year: true, seatingCapacity: true,
          },
        },
        driver: {
          select: {
            id: true, firstName: true, lastName: true, phone: true, photo: true,
            licenses: { select: { licenseNumber: true } },
          },
        },
        tripStops: { orderBy: { stopOrder: 'asc' } },
        tripCargos: true,
        tripTimelines: { orderBy: { eventTime: 'desc' } },
        odometerReadings: true,
      },
    });

    if (!trip) return null;

    // Get latest vehicle location
    const latestLocation = await prisma.vehicleLocation.findFirst({
      where: { vehicleId: trip.vehicleId, companyId: this.companyId },
      orderBy: { timestamp: 'desc' },
    });

    return { ...trip, latestLocation };
  }

  /**
   * Get live vehicle location for tracking
   */
  async getLiveLocation(tripId: string) {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        companyId: this.companyId,
        customerId: this.customerId,
        deletedAt: null,
      },
      select: { vehicleId: true },
    });
    if (!trip) return null;

    const location = await prisma.vehicleLocation.findFirst({
      where: { vehicleId: trip.vehicleId, companyId: this.companyId },
      orderBy: { timestamp: 'desc' },
    });

    return location;
  }

  /**
   * Get customer invoices
   */
  async getInvoices(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
        },
      }),
    ]);
    return { items, total, page, limit };
  }

  /**
   * Get delivery documents
   */
  async getDeliveryDocuments(tripId: string) {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        companyId: this.companyId,
        customerId: this.customerId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!trip) return [];

    return prisma.vehicleDocument.findMany({
      where: {
        companyId: this.companyId,
        documentType: 'REGISTRATION',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Submit support request
   */
  async submitSupportRequest(data: { subject: string; message: string; tripId?: string; priority?: string }): Promise<any> {
    return prisma.activityLog.create({
      data: {
        companyId: this.companyId,
        driverId: this.customerId,
        action: 'SUPPORT_REQUEST',
        description: data.subject,
        metadata: {
          message: data.message,
          priority: data.priority || 'NORMAL',
          source: 'customer_portal',
          tripId: data.tripId,
        },
      },
    });
  }

  /**
   * Get customer profile
   */
  async getProfile() {
    return prisma.customer.findUnique({
      where: { id: this.customerId },
      select: {
        id: true, name: true, email: true, phone: true, phone2: true,
        address: true, city: true, state: true, country: true, postalCode: true,
        taxId: true, website: true, notes: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  /**
   * Update customer profile
   */
  async updateProfile(data: any) {
    return prisma.customer.update({
      where: { id: this.customerId },
      data: {
        name: data.name,
        phone: data.phone,
        phone2: data.phone2,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        website: data.website,
      },
    });
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary() {
    const [activeShipments, completedDeliveries, totalInvoices, pendingInvoices] = await Promise.all([
      prisma.trip.count({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'SCHEDULED'] },
        },
      }),
      prisma.trip.count({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
          status: 'COMPLETED',
        },
      }),
      prisma.invoice.count({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
        },
      }),
      prisma.invoice.count({
        where: {
          companyId: this.companyId,
          customerId: this.customerId,
          deletedAt: null,
          status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
        },
      }),
    ]);

    return { activeShipments, completedDeliveries, totalInvoices, pendingInvoices };
  }
}

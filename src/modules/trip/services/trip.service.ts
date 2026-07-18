import { prisma } from '@/lib/prisma';
import { tripRepository, tripStopRepository } from '../repositories/trip.repository';
import {
  CreateTripInput,
  UpdateTripInput,
  TripSearchInput,
  StartTripInput,
  PauseTripInput,
  ResumeTripInput,
  CompleteTripInput,
  CancelTripInput,
  UpdateTripStopInput,
  UpdateTripChecklistInput,
  TripInspectionInput,
  TripTimelineInput,
} from '../validators/trip.validator';
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PLANNED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED', 'DELAYED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'DELAYED'],
  DELAYED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export class TripService {
  async getAll(companyId: string, search: TripSearchInput) {
    const where: Prisma.TripWhereInput = {};
    if (search.q) {
      where.OR = [
        { title: { contains: search.q, mode: 'insensitive' } },
        { tripNumber: { contains: search.q, mode: 'insensitive' } },
        { description: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.vehicleId) where.vehicleId = search.vehicleId;
    if (search.driverId) where.driverId = search.driverId;
    if (search.priority) where.priority = search.priority;

    const result = await tripRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return { ...result, page: search.page, limit: search.limit, totalPages: Math.ceil(result.total / search.limit) };
  }

  async getById(id: string, companyId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');
    return trip;
  }

  async create(companyId: string, data: CreateTripInput, createdById: string) {
    // Validate vehicle and driver exist and are active
    const vehicle = await this.checkVehicleExists(data.vehicleId, companyId);
    const driver = await this.checkDriverExists(data.driverId, companyId);

    // Check for overlapping trips
    if (data.startTime) {
      const startTime = new Date(data.startTime);
      const endTime = data.estimatedEndTime ? new Date(data.estimatedEndTime) : undefined;
      const overlaps = await tripRepository.findOverlappingTrips(companyId, {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        startTime,
        endTime,
      });
      if (overlaps.length > 0) {
        throw new ConflictError('Vehicle or driver has overlapping trips during this time period');
      }
    }

    const tripNumber = await tripRepository.generateTripNumber(companyId);

    const { tripStops, tripCargos, tripChecklists, ...tripData } = data;

    const trip = await tripRepository.create({
      ...tripData,
      tripNumber,
      status: 'PLANNED' as any,
      company: { connect: { id: companyId } },
      vehicle: { connect: { id: data.vehicleId } },
      driver: { connect: { id: data.driverId } },
      ...(data.routeId && { route: { connect: { id: data.routeId } } }),
      ...(data.customerId && { customer: { connect: { id: data.customerId } } }),
      ...(data.startTime && { startTime: new Date(data.startTime) }),
      ...(data.estimatedEndTime && { estimatedEndTime: new Date(data.estimatedEndTime) }),
    } as Prisma.TripCreateInput);

    // Create trip stops
    if (tripStops && tripStops.length > 0) {
      for (let i = 0; i < tripStops.length; i++) {
        const stop = tripStops[i];
        await tripRepository.createTripStop({
          trip: { connect: { id: trip.id } },
          ...(stop.routeStopId && { routeStop: { connect: { id: stop.routeStopId } } }),
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          ...(stop.scheduledArrival && { scheduledArrival: new Date(stop.scheduledArrival) }),
          status: stop.status as any,
          notes: stop.notes,
          stopOrder: stop.stopOrder || i,
        } as Prisma.TripStopCreateInput);
      }
    }

    // Create trip cargos
    if (tripCargos && tripCargos.length > 0) {
      for (const cargo of tripCargos) {
        await tripRepository.createTripCargo({
          trip: { connect: { id: trip.id } },
          company: { connect: { id: companyId } },
          cargoType: cargo.cargoType,
          weight: cargo.weight,
          volume: cargo.volume,
          quantity: cargo.quantity,
          isDangerousGoods: cargo.isDangerousGoods,
          temperatureRequired: cargo.temperatureRequired,
          customerReference: cargo.customerReference,
          deliveryInstructions: cargo.deliveryInstructions,
          notes: cargo.notes,
        } as Prisma.TripCargoCreateInput);
      }
    }

    // Create trip checklists
    if (tripChecklists && tripChecklists.length > 0) {
      for (const item of tripChecklists) {
        await tripRepository.createTripChecklist({
          trip: { connect: { id: trip.id } },
          company: { connect: { id: companyId } },
          item: item.item,
          isRequired: item.isRequired,
          isCompleted: item.isCompleted,
          notes: item.notes,
        } as Prisma.TripChecklistCreateInput);
      }
    }

    // Create timeline event
    await tripRepository.createTimeline({
      trip: { connect: { id: trip.id } },
      company: { connect: { id: companyId } },
      eventType: 'CREATED',
      userId: createdById,
      notes: `Trip ${tripNumber} created`,
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'TRIP_CREATED',
      entityType: 'Trip',
      entityId: trip.id,
      description: `Trip ${tripNumber} created`,
    });

    return tripRepository.findById(trip.id, companyId);
  }

  async update(id: string, companyId: string, data: UpdateTripInput, updatedById: string) {
    const existing = await tripRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Trip not found');

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestError('Cannot update a completed or cancelled trip');
    }

    // Check for overlapping trips if changing vehicle/driver/times
    if (data.vehicleId || data.driverId || data.startTime || data.estimatedEndTime) {
      const startTime = data.startTime ? new Date(data.startTime) : existing.startTime || undefined;
      const endTime = data.estimatedEndTime ? new Date(data.estimatedEndTime) : existing.estimatedEndTime || undefined;
      const vehicleId = data.vehicleId || existing.vehicleId;
      const driverId = data.driverId || existing.driverId;
      if (startTime) {
        const overlaps = await tripRepository.findOverlappingTrips(companyId, {
          vehicleId,
          driverId,
          startTime,
          endTime,
          excludeTripId: id,
        });
        if (overlaps.length > 0) {
          throw new ConflictError('Vehicle or driver has overlapping trips during this time period');
        }
      }
    }

    const updateData: Prisma.TripUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.startTime !== undefined) updateData.startTime = data.startTime ? new Date(data.startTime) : null;
    if (data.estimatedEndTime !== undefined) updateData.estimatedEndTime = data.estimatedEndTime ? new Date(data.estimatedEndTime) : null;
    if (data.estimatedDistance !== undefined) updateData.estimatedDistance = data.estimatedDistance;
    if (data.routeId !== undefined) updateData.route = data.routeId ? { connect: { id: data.routeId } } : { disconnect: true };
    if (data.customerId !== undefined) updateData.customer = data.customerId ? { connect: { id: data.customerId } } : { disconnect: true };
    if (data.vehicleId !== undefined) updateData.vehicle = { connect: { id: data.vehicleId } };
    if (data.driverId !== undefined) updateData.driver = { connect: { id: data.driverId } };

    await tripRepository.update(id, companyId, updateData);

    // Handle nested updates
    if (data.tripStops !== undefined) {
      await tripRepository.deleteTripStopsByTrip(id);
      if (data.tripStops && data.tripStops.length > 0) {
        for (let i = 0; i < data.tripStops.length; i++) {
          const stop = data.tripStops[i];
          await tripRepository.createTripStop({
            trip: { connect: { id } },
            ...(stop.routeStopId && { routeStop: { connect: { id: stop.routeStopId } } }),
            name: stop.name,
            address: stop.address,
            latitude: stop.latitude,
            longitude: stop.longitude,
            ...(stop.scheduledArrival && { scheduledArrival: new Date(stop.scheduledArrival) }),
            status: stop.status as any,
            notes: stop.notes,
            stopOrder: stop.stopOrder || i,
          } as Prisma.TripStopCreateInput);
        }
      }
    }

    if (data.tripCargos !== undefined) {
      await tripRepository.deleteTripCargosByTrip(id);
      if (data.tripCargos && data.tripCargos.length > 0) {
        for (const cargo of data.tripCargos) {
          await tripRepository.createTripCargo({
            trip: { connect: { id } },
            company: { connect: { id: companyId } },
            cargoType: cargo.cargoType,
            weight: cargo.weight,
            volume: cargo.volume,
            quantity: cargo.quantity,
            isDangerousGoods: cargo.isDangerousGoods,
            temperatureRequired: cargo.temperatureRequired,
            customerReference: cargo.customerReference,
            deliveryInstructions: cargo.deliveryInstructions,
            notes: cargo.notes,
          } as Prisma.TripCargoCreateInput);
        }
      }
    }

    if (data.tripChecklists !== undefined) {
      await tripRepository.deleteTripChecklistsByTrip(id);
      if (data.tripChecklists && data.tripChecklists.length > 0) {
        for (const item of data.tripChecklists) {
          await tripRepository.createTripChecklist({
            trip: { connect: { id } },
            company: { connect: { id: companyId } },
            item: item.item,
            isRequired: item.isRequired,
            isCompleted: item.isCompleted,
            notes: item.notes,
          } as Prisma.TripChecklistCreateInput);
        }
      }
    }

    await tripRepository.createTimeline({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      eventType: 'UPDATED',
      userId: updatedById,
      notes: 'Trip updated',
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'TRIP_UPDATED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${existing.tripNumber} updated`,
    });

    return tripRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const existing = await tripRepository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Trip not found');
    if (existing.status === 'IN_PROGRESS') {
      throw new BadRequestError('Cannot delete a trip that is in progress. Please cancel it first.');
    }

    await tripRepository.softDelete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'TRIP_DELETED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${existing.tripNumber} deleted`,
    });

    return { message: 'Trip deleted successfully' };
  }

  async startTrip(id: string, companyId: string, data: StartTripInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');

    this.validateStatusTransition(trip.status as string, 'IN_PROGRESS');

    // Check all required checklist items are completed
    const checklists = await tripRepository.findChecklistByTrip(id);
    const requiredItems = checklists.filter(c => c.isRequired && !c.isCompleted);
    if (requiredItems.length > 0) {
      throw new BadRequestError(`Cannot start trip: ${requiredItems.length} required checklist item(s) not completed`);
    }

    await tripRepository.update(id, companyId, {
      status: 'IN_PROGRESS' as any,
      actualStartTime: new Date(),
      startOdometer: data.startOdometer,
    });

    await tripRepository.createTimeline({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      eventType: 'STARTED',
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes || 'Trip started',
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_STARTED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${trip.tripNumber} started`,
    });

    return tripRepository.findById(id, companyId);
  }

  async pauseTrip(id: string, companyId: string, data: PauseTripInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');

    this.validateStatusTransition(trip.status as string, 'DELAYED');

    await tripRepository.update(id, companyId, {
      status: 'DELAYED' as any,
    });

    await tripRepository.createTimeline({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      eventType: 'PAUSED',
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes || 'Trip paused',
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_PAUSED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${trip.tripNumber} paused`,
    });

    return tripRepository.findById(id, companyId);
  }

  async resumeTrip(id: string, companyId: string, data: ResumeTripInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');

    this.validateStatusTransition(trip.status as string, 'IN_PROGRESS');

    await tripRepository.update(id, companyId, {
      status: 'IN_PROGRESS' as any,
    });

    await tripRepository.createTimeline({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      eventType: 'RESUMED',
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes || 'Trip resumed',
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_RESUMED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${trip.tripNumber} resumed`,
    });

    return tripRepository.findById(id, companyId);
  }

  async completeTrip(id: string, companyId: string, data: CompleteTripInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');

    this.validateStatusTransition(trip.status as string, 'COMPLETED');

    await tripRepository.update(id, companyId, {
      status: 'COMPLETED' as any,
      actualEndTime: new Date(),
      endOdometer: data.endOdometer,
      distance: data.distance,
      fuelCost: data.fuelCost,
      totalCost: data.totalCost,
    });

    await tripRepository.createTimeline({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      eventType: 'COMPLETED',
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes || 'Trip completed',
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_COMPLETED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${trip.tripNumber} completed`,
    });

    return tripRepository.findById(id, companyId);
  }

  async cancelTrip(id: string, companyId: string, data: CancelTripInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');

    if (trip.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel a completed trip');
    }

    await tripRepository.update(id, companyId, {
      status: 'CANCELLED' as any,
      cancellationReason: data.cancellationReason,
      cancelledAt: new Date(),
      cancelledBy: userId,
    });

    await tripRepository.createTimeline({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      eventType: 'CANCELLED',
      userId,
      notes: data.notes || `Trip cancelled: ${data.cancellationReason}`,
    } as Prisma.TripTimelineCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_CANCELLED',
      entityType: 'Trip',
      entityId: id,
      description: `Trip ${trip.tripNumber} cancelled: ${data.cancellationReason}`,
    });

    return tripRepository.findById(id, companyId);
  }

  async getTimeline(id: string, companyId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');
    return tripRepository.findTimelinesByTrip(id);
  }

  async getChecklist(id: string, companyId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');
    return tripRepository.findChecklistByTrip(id);
  }

  async updateChecklist(id: string, companyId: string, data: UpdateTripChecklistInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new BadRequestError('Cannot update checklist for a completed or cancelled trip');
    }

    await tripRepository.updateTripChecklist(data.id, {
      isCompleted: data.isCompleted,
      completedAt: data.isCompleted ? new Date() : null,
      completedBy: data.isCompleted ? userId : null,
      notes: data.notes,
    });

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_CHECKLIST_UPDATED',
      entityType: 'Trip',
      entityId: id,
      description: 'Trip checklist updated',
    });

    return tripRepository.findChecklistByTrip(id);
  }

  async getInspections(id: string, companyId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');
    return tripRepository.findInspectionsByTrip(id);
  }

  async createInspection(id: string, companyId: string, data: TripInspectionInput, userId: string) {
    const trip = await tripRepository.findById(id, companyId);
    if (!trip) throw new NotFoundError('Trip not found');

    const inspection = await tripRepository.createInspection({
      trip: { connect: { id } },
      company: { connect: { id: companyId } },
      type: data.type as any,
      odometer: data.odometer,
      fuelLevel: data.fuelLevel,
      photos: data.photos || [],
      damageReport: data.damageReport,
      comments: data.comments,
      signature: data.signature,
      inspectedBy: userId,
      inspectedAt: new Date(),
    } as Prisma.TripInspectionCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId,
      action: 'TRIP_INSPECTION_CREATED',
      entityType: 'TripInspection',
      entityId: inspection.id,
      description: `${data.type} inspection created for trip`,
    });

    return inspection;
  }

  async getFilters(companyId: string) {
    return tripRepository.getFilterOptions(companyId);
  }

  // Helper methods
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestError(`Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`);
    }
  }

  private async checkVehicleExists(vehicleId: string, companyId: string) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, deletedAt: null } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  private async checkDriverExists(driverId: string, companyId: string) {
    const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId, deletedAt: null } });
    if (!driver) throw new NotFoundError('Driver not found');
    return driver;
  }
}

export const tripService = new TripService();

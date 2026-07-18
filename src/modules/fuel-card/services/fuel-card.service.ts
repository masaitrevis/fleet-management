import { fuelCardRepository } from '../repositories/fuel-card.repository';
import {
  CreateFuelCardInput,
  UpdateFuelCardInput,
  FuelCardSearchInput,
} from '../validators/fuel-card.validator';
import { NotFoundError, BadRequestError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class FuelCardService {
  async getAll(companyId: string, search: FuelCardSearchInput) {
    const where: Prisma.FuelCardWhereInput = { deletedAt: null };
    if (search.q) {
      where.OR = [
        { cardNumber: { contains: search.q, mode: 'insensitive' } },
        { cardHolderName: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search.status) where.status = search.status as any;
    if (search.driverId) where.assignedDriverId = search.driverId;
    if (search.vehicleId) where.assignedVehicleId = search.vehicleId;

    const result = await fuelCardRepository.findAll(companyId, {
      skip: (search.page - 1) * search.limit,
      take: search.limit,
      where,
      orderBy: { [search.sortBy]: search.sortOrder } as any,
    });

    return {
      ...result,
      page: search.page,
      limit: search.limit,
      totalPages: Math.ceil(result.total / search.limit),
    };
  }

  async getById(id: string, companyId: string) {
    const card = await fuelCardRepository.findById(id, companyId);
    if (!card) throw new NotFoundError('Fuel card not found');
    return card;
  }

  async getTransactions(id: string, companyId: string, page = 1, limit = 50) {
    const card = await fuelCardRepository.findById(id, companyId);
    if (!card) throw new NotFoundError('Fuel card not found');
    return fuelCardRepository.findTransactions(id, {
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async create(companyId: string, data: CreateFuelCardInput, createdById: string) {
    if (data.assignedDriverId) {
      const driver = await prisma.driver.findFirst({
        where: { id: data.assignedDriverId, companyId, deletedAt: null },
      });
      if (!driver) throw new NotFoundError('Assigned driver not found');
    }
    if (data.assignedVehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.assignedVehicleId, companyId, deletedAt: null },
      });
      if (!vehicle) throw new NotFoundError('Assigned vehicle not found');
    }

    const card = await fuelCardRepository.create({
      ...data,
      company: { connect: { id: companyId } },
      ...(data.assignedDriverId && { assignedDriver: { connect: { id: data.assignedDriverId } } }),
      ...(data.assignedVehicleId && { assignedVehicle: { connect: { id: data.assignedVehicleId } } }),
    } as Prisma.FuelCardCreateInput);

    await authRepository.createAuditLog({
      companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'FuelCard',
      entityId: card.id,
      description: `Fuel card ${data.cardNumber} created`,
    });

    return card;
  }

  async update(id: string, companyId: string, data: UpdateFuelCardInput, updatedById: string) {
    const card = await fuelCardRepository.findById(id, companyId);
    if (!card) throw new NotFoundError('Fuel card not found');

    if (data.assignedDriverId) {
      const driver = await prisma.driver.findFirst({
        where: { id: data.assignedDriverId, companyId, deletedAt: null },
      });
      if (!driver) throw new NotFoundError('Assigned driver not found');
    }
    if (data.assignedVehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.assignedVehicleId, companyId, deletedAt: null },
      });
      if (!vehicle) throw new NotFoundError('Assigned vehicle not found');
    }

    const updateData: Prisma.FuelCardUpdateInput = { ...data };
    if (data.assignedDriverId !== undefined) {
      if (data.assignedDriverId === null) {
        updateData.assignedDriver = { disconnect: true };
      } else {
        updateData.assignedDriver = { connect: { id: data.assignedDriverId } };
      }
    }
    if (data.assignedVehicleId !== undefined) {
      if (data.assignedVehicleId === null) {
        updateData.assignedVehicle = { disconnect: true };
      } else {
        updateData.assignedVehicle = { connect: { id: data.assignedVehicleId } };
      }
    }

    await fuelCardRepository.update(id, companyId, updateData);

    await authRepository.createAuditLog({
      companyId,
      userId: updatedById,
      action: 'UPDATE',
      entityType: 'FuelCard',
      entityId: id,
      description: `Fuel card ${card.cardNumber} updated`,
    });

    return fuelCardRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string, deletedById: string) {
    const card = await fuelCardRepository.findById(id, companyId);
    if (!card) throw new NotFoundError('Fuel card not found');

    await fuelCardRepository.delete(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: deletedById,
      action: 'DELETE',
      entityType: 'FuelCard',
      entityId: id,
      description: `Fuel card ${card.cardNumber} deleted`,
    });

    return { message: 'Fuel card deleted' };
  }

  async checkLimits(fuelCardId: string, amount: number, date: Date) {
    const card = await prisma.fuelCard.findFirst({
      where: { id: fuelCardId, deletedAt: null },
    });
    if (!card) throw new NotFoundError('Fuel card not found');
    if (card.status !== 'ACTIVE') throw new BadRequestError('Fuel card is not active');

    if (card.expiryDate && new Date(card.expiryDate) < date) {
      throw new BadRequestError('Fuel card has expired');
    }

    if (card.spendingLimit) {
      const totalSpent = await fuelCardRepository.getMonthlySpending(fuelCardId, date);
      if (totalSpent + amount > card.spendingLimit) {
        throw new BadRequestError('Transaction exceeds card spending limit');
      }
    }

    if (card.dailyLimit) {
      const dailySpent = await fuelCardRepository.getDailySpending(fuelCardId, date);
      if (dailySpent + amount > card.dailyLimit) {
        throw new BadRequestError('Transaction exceeds daily limit');
      }
    }

    if (card.monthlyLimit) {
      const monthlySpent = await fuelCardRepository.getMonthlySpending(fuelCardId, date);
      if (monthlySpent + amount > card.monthlyLimit) {
        throw new BadRequestError('Transaction exceeds monthly limit');
      }
    }

    return { allowed: true };
  }

  async recordTransaction(fuelCardId: string, _companyId: string, data: {
    fuelLogId?: string;
    amount: number;
    currency: string;
    location?: string;
    transactionType: string;
    merchantName?: string;
  }) {
    return fuelCardRepository.createTransaction({
      ...data,
      fuelCard: { connect: { id: fuelCardId } },
      timestamp: new Date(),
    } as Prisma.FuelCardTransactionCreateInput);
  }
}

export const fuelCardService = new FuelCardService();

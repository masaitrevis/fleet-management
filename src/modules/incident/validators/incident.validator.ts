import { z } from 'zod';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

export const createIncidentSchema = z.object({
  incidentType: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(IncidentSeverity),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  incidentDate: z.string().datetime().or(z.date()),
  incidentTime: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable(),
  vehicleDamage: z.string().max(2000).optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  insuranceClaim: z.boolean().default(false),
  claimNumber: z.string().max(100).optional().nullable(),
  fineAmount: z.number().optional().nullable(),
  penaltyPoints: z.number().int().optional().nullable(),
  legalAction: z.boolean().default(false),
  courtDate: z.string().datetime().optional().nullable(),
});

export const updateIncidentSchema = createIncidentSchema.partial().extend({
  status: z.nativeEnum(IncidentStatus).optional(),
  investigationNotes: z.string().max(5000).optional().nullable(),
  rootCause: z.string().max(2000).optional().nullable(),
  resolution: z.string().max(2000).optional().nullable(),
  investigatedBy: z.string().uuid().optional().nullable(),
  resolvedBy: z.string().uuid().optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable(),
});

export const incidentSearchSchema = z.object({
  q: z.string().optional(),
  incidentType: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();

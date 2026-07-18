import { z } from 'zod';

export const VehicleStatus = z.enum(['ACTIVE', 'IN_MAINTENANCE', 'RESERVED', 'OUT_OF_SERVICE', 'SOLD', 'SCRAPPED', 'STOLEN']);
export const VehicleAvailability = z.enum(['AVAILABLE', 'ASSIGNED', 'RESERVED', 'MAINTENANCE', 'OFFLINE']);
export const VehicleCategory = z.enum(['TRUCK', 'BUS', 'VAN', 'PICKUP', 'SUV', 'SEDAN', 'MOTORCYCLE', 'TRAILER', 'HEAVY_EQUIPMENT']);
export const FuelType = z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG', 'LPG']);
export const TransmissionType = z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'SEMI_AUTOMATIC']);
export const DocumentType = z.enum(['LOGBOOK', 'INSURANCE', 'ROAD_LICENSE', 'INSPECTION_CERTIFICATE', 'EMISSIONS_CERTIFICATE', 'IMPORT_DOCUMENTS', 'WARRANTY']);

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1).max(50),
  plateNumber: z.string().min(1).max(50).optional(),
  vin: z.string().min(1).max(50).optional(),
  chassisNumber: z.string().min(1).max(50).optional(),
  engineNumber: z.string().min(1).max(50).optional(),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  trim: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  status: VehicleStatus.default('ACTIVE'),
  availability: VehicleAvailability.default('AVAILABLE'),
  color: z.string().max(50).optional(),
  category: VehicleCategory.optional(),
  customCategoryId: z.string().uuid().optional(),
  fuelType: FuelType.optional(),
  transmission: TransmissionType.optional(),
  engineCapacity: z.number().positive().optional(),
  horsepower: z.number().positive().optional(),
  torque: z.number().positive().optional(),
  seatingCapacity: z.number().int().positive().optional(),
  payloadCapacity: z.number().positive().optional(),
  grossWeight: z.number().positive().optional(),
  axles: z.number().int().positive().optional(),
  tyreSize: z.string().max(50).optional(),
  fuelTankCapacity: z.number().positive().optional(),
  odometer: z.number().int().nonnegative().optional(),
  engineHours: z.number().nonnegative().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  fleetManagerId: z.string().uuid().optional(),
  currentDriverId: z.string().uuid().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  fuelType: z.string().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
  assignedDriverId: z.string().uuid().optional(),
  availability: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const vehicleAssignmentSchema = z.object({
  driverId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const odometerSchema = z.object({
  reading: z.number().int().nonnegative(),
  source: z.enum(['MANUAL', 'GPS', 'FUEL_ENTRY', 'TRIP']).default('MANUAL'),
  notes: z.string().max(500).optional(),
});

export const createVehicleDocumentSchema = z.object({
  vehicleId: z.string().uuid(),
  type: DocumentType,
  title: z.string().min(1).max(200),
  url: z.string().url(),
  expiryDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  reminderDays: z.number().int().min(0).max(365).default(30),
});

export const updateVehicleDocumentSchema = createVehicleDocumentSchema.partial().omit({ vehicleId: true });

export const createVehicleCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  icon: z.string().max(100).optional(),
  isCustom: z.boolean().default(true),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleSearchInput = z.infer<typeof vehicleSearchSchema>;
export type VehicleAssignmentInput = z.infer<typeof vehicleAssignmentSchema>;
export type OdometerInput = z.infer<typeof odometerSchema>;
export type CreateVehicleDocumentInput = z.infer<typeof createVehicleDocumentSchema>;
export type UpdateVehicleDocumentInput = z.infer<typeof updateVehicleDocumentSchema>;
export type CreateVehicleCategoryInput = z.infer<typeof createVehicleCategorySchema>;

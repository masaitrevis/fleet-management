import { z } from 'zod';

export const DriverStatus = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED', 'ON_LEAVE', 'PENDING']);
export const LicenseClass = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'M', 'OTHER']);
export const LicenseType = z.enum(['COMMERCIAL', 'NON_COMMERCIAL', 'LEARNER', 'PROVISIONAL', 'INTERNATIONAL']);
export const Gender = z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER']);
export const MaritalStatus = z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER']);
export const DocumentType = z.enum([
  'REGISTRATION', 'INSURANCE', 'INSPECTION', 'LICENSE', 'CERTIFICATION',
  'MEDICAL', 'TRAINING', 'PERMIT', 'PHOTO', 'CONTRACT', 'OTHER',
  'LOGBOOK', 'ROAD_LICENSE', 'INSPECTION_CERTIFICATE', 'EMISSIONS_CERTIFICATE',
  'IMPORT_DOCUMENTS', 'WARRANTY',
]);

export const driverLicenseSchema = z.object({
  licenseNumber: z.string().min(1).max(50),
  licenseClass: z.string().max(20).optional(),
  licenseType: z.string().max(20).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  issuingAuthority: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  documentUrl: z.string().url().optional(),
});

export const createDriverSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional(),
  phone: z.string().min(5).max(20),
  phone2: z.string().max(20).optional(),
  employeeId: z.string().max(50).optional(),
  userId: z.string().uuid().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().max(100).optional(),
  idNumber: z.string().max(50).optional(),
  hireDate: z.string().datetime().optional(),
  terminationDate: z.string().datetime().optional(),
  status: DriverStatus.default('PENDING'),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  photo: z.string().optional(),
  licenses: z.array(driverLicenseSchema).optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export const driverSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  licenseClass: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const driverVehicleAssignmentSchema = z.object({
  vehicleId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const createDriverDocumentSchema = z.object({
  driverId: z.string().uuid(),
  documentType: DocumentType,
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().optional(),
  mimeType: z.string().max(100).optional(),
  expiryDate: z.string().datetime().optional(),
  issueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateDriverDocumentSchema = createDriverDocumentSchema.partial().omit({ driverId: true }).extend({
  isVerified: z.boolean().optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverSearchInput = z.infer<typeof driverSearchSchema>;
export type DriverVehicleAssignmentInput = z.infer<typeof driverVehicleAssignmentSchema>;
export type CreateDriverDocumentInput = z.infer<typeof createDriverDocumentSchema>;
export type UpdateDriverDocumentInput = z.infer<typeof updateDriverDocumentSchema>;

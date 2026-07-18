import { z } from 'zod';

export const ShiftType = z.enum(['DAY', 'NIGHT', 'SPLIT', 'WEEKEND', 'HOLIDAY', 'CUSTOM']);

export const createShiftSchema = z.object({
  name: z.string().min(1).max(100),
  shiftType: ShiftType.default('DAY'),
  startTime: z.string().regex(/^([0-1]?\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, use HH:MM'),
  endTime: z.string().regex(/^([0-1]?\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, use HH:MM'),
  breakMinutes: z.number().int().min(0).max(300).default(30),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  isActive: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

export const updateShiftSchema = createShiftSchema.partial();

export const shiftSearchSchema = z.object({
  q: z.string().optional(),
  shiftType: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateShiftInput = {
  name: string;
  shiftType?: 'DAY' | 'NIGHT' | 'SPLIT' | 'WEEKEND' | 'HOLIDAY' | 'CUSTOM';
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  daysOfWeek?: number[];
  isActive?: boolean;
  notes?: string;
};

export type UpdateShiftInput = {
  name?: string;
  shiftType?: 'DAY' | 'NIGHT' | 'SPLIT' | 'WEEKEND' | 'HOLIDAY' | 'CUSTOM';
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  daysOfWeek?: number[];
  isActive?: boolean;
  notes?: string;
};

export type ShiftSearchInput = {
  q?: string;
  shiftType?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

import { z } from 'zod';

export const complianceAnalyticsSearchSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
}).partial();

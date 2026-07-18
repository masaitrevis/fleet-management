import { z } from 'zod';

export const createThreadSchema = z.object({
  subject: z.string().min(1).max(200),
  participants: z.array(z.string().uuid()),
});

export const createMessageSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).optional().default([]),
});

export const threadSearchSchema = z.object({
  q: z.string().optional(),
  isArchived: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).partial();

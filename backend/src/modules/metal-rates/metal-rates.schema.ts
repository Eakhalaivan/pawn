import { z } from 'zod';

export const setMetalRateSchema = z.object({
  metalType: z.enum(['GOLD', 'SILVER']),
  ratePerGram: z.number().positive(),
  effectiveDate: z.string().datetime().optional(),
});

export const rateHistoryQuerySchema = z.object({
  metalType: z.enum(['GOLD', 'SILVER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type SetMetalRateInput = z.infer<typeof setMetalRateSchema>;
export type RateHistoryQueryInput = z.infer<typeof rateHistoryQuerySchema>;

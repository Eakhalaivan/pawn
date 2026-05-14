import { z } from 'zod';

export const pledgeItemSchema = z.object({
  jewelleryTypeId: z.string().uuid(),
  itemDescription: z.string().min(1),
  grossWeightGrams: z.number().positive(),
  netWeightGrams: z.number().positive(),
  purity: z.string().min(1),
  quantity: z.number().int().positive(),
  itemValue: z.number().positive(),
});

export const createPledgeSchema = z.object({
  customerId: z.string().uuid(),
  schemeId: z.string().uuid(),
  loanTypeId: z.string().uuid(),
  loanAmount: z.number().positive(),
  documentCharges: z.number().nonnegative(),
  items: z.array(pledgeItemSchema).min(1),
  notes: z.string().optional(),
});

export const partPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD']),
  notes: z.string().optional(),
});

export const pledgeQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PART_PAID', 'REDEEMED', 'CANCELLED', 'AUCTIONED']).optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export type CreatePledgeInput = z.infer<typeof createPledgeSchema>;
export type PartPaymentInput = z.infer<typeof partPaymentSchema>;
export type PledgeQueryInput = z.infer<typeof pledgeQuerySchema>;

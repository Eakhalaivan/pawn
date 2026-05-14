import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

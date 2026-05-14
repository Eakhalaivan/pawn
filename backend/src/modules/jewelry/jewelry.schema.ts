import { z } from 'zod';

export const createJewelryItemSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string().min(1),
  imageUrl: z.string().url().optional(),
  metalType: z.enum(['GOLD', 'SILVER']),
  weightGrams: z.number().positive(),
  wastagePercent: z.number().min(0),
  stock: z.number().int().min(0).optional(),
});

export const updateJewelryItemSchema = createJewelryItemSchema.partial();

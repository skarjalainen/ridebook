import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema } from './common.js';

export const poiCategorySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  icon: z.string().min(1).max(100),
  sortOrder: z.number().int(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type PoiCategory = z.infer<typeof poiCategorySchema>;

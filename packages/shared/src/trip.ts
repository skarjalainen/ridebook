import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema, isoDateSchema } from './common.js';
import { poiFeatureSchema } from './poi.js';
import { routeSchema } from './route.js';

export const tripSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(4000).nullable(),
  plannedDate: isoDateSchema.nullable(),
  /** RULE-008: a trip is driven when drivenAt is non-null. */
  drivenAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const tripPoiSchema = z.object({
  sequence: z.number().int().nonnegative(),
  poi: poiFeatureSchema,
});

/** RULE-005 and RULE-006: both `route` and `pois` may legitimately be empty. */
export const tripDetailSchema = tripSchema.extend({
  route: routeSchema.nullable(),
  pois: z.array(tripPoiSchema),
});

export const createTripSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().max(4000).nullish(),
  plannedDate: isoDateSchema.nullish(),
  drivenAt: isoDateTimeSchema.nullish(),
});

export const updateTripSchema = createTripSchema.partial();

export const addTripPoiSchema = z.object({
  poiId: uuidSchema,
  sequence: z.number().int().nonnegative().optional(),
});

export const reorderTripPoisSchema = z.object({
  poiIds: z.array(uuidSchema),
});

export type Trip = z.infer<typeof tripSchema>;
export type TripPoi = z.infer<typeof tripPoiSchema>;
export type TripDetail = z.infer<typeof tripDetailSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type AddTripPoiInput = z.infer<typeof addTripPoiSchema>;
export type ReorderTripPoisInput = z.infer<typeof reorderTripPoisSchema>;

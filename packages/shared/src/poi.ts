import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema } from './common.js';
import {
  featureCollectionSchema,
  featureSchema,
  pointGeometrySchema,
  boundingBoxQuerySchema,
} from './geo.js';

export const poiPropertiesSchema = z.object({
  id: uuidSchema,
  categoryId: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(4000).nullable(),
  /** RULE-007: a POI is visited when visitedAt is non-null. */
  visitedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const poiFeatureSchema = featureSchema(pointGeometrySchema, poiPropertiesSchema);
export const poiFeatureCollectionSchema = featureCollectionSchema(poiFeatureSchema);

export const createPoiSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().max(4000).nullish(),
  location: pointGeometrySchema,
  visitedAt: isoDateTimeSchema.nullish(),
});

export const updatePoiSchema = createPoiSchema.partial();

export const listPoisQuerySchema = z.object({
  bbox: boundingBoxQuerySchema.optional(),
  categoryId: uuidSchema.optional(),
});

export type PoiProperties = z.infer<typeof poiPropertiesSchema>;
export type PoiFeature = z.infer<typeof poiFeatureSchema>;
export type PoiFeatureCollection = z.infer<typeof poiFeatureCollectionSchema>;
export type CreatePoiInput = z.infer<typeof createPoiSchema>;
export type UpdatePoiInput = z.infer<typeof updatePoiSchema>;
export type ListPoisQuery = z.infer<typeof listPoisQuerySchema>;

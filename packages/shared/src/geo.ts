import { z } from 'zod';

export const longitudeSchema = z.number().min(-180).max(180);
export const latitudeSchema = z.number().min(-90).max(90);

/** GeoJSON position: [longitude, latitude]. Order matters and is easy to get wrong. */
export const positionSchema = z.tuple([longitudeSchema, latitudeSchema]);

export const pointGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: positionSchema,
});

export const lineStringGeometrySchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(positionSchema).min(2),
});

export const featureSchema = <G extends z.ZodType, P extends z.ZodType>(
  geometry: G,
  properties: P,
) =>
  z.object({
    type: z.literal('Feature'),
    id: z.string(),
    geometry,
    properties,
  });

export const featureCollectionSchema = <F extends z.ZodType>(feature: F) =>
  z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(feature),
  });

export const boundingBoxSchema = z.tuple([
  longitudeSchema,
  latitudeSchema,
  longitudeSchema,
  latitudeSchema,
]);

/** Parses the `bbox=minLon,minLat,maxLon,maxLat` query parameter. */
export const boundingBoxQuerySchema = z
  .string()
  .transform((value, ctx) => {
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      ctx.addIssue({
        code: 'custom',
        message: 'bbox must be four numbers: minLon,minLat,maxLon,maxLat',
      });
      return z.NEVER;
    }
    return parts;
  })
  .pipe(boundingBoxSchema)
  .superRefine((bbox, ctx) => {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    if (minLon >= maxLon || minLat >= maxLat) {
      ctx.addIssue({
        code: 'custom',
        message: 'bbox minimum values must be smaller than maximum values',
      });
    }
  });

export type Position = z.infer<typeof positionSchema>;
export type PointGeometry = z.infer<typeof pointGeometrySchema>;
export type LineStringGeometry = z.infer<typeof lineStringGeometrySchema>;
export type BoundingBox = z.infer<typeof boundingBoxSchema>;

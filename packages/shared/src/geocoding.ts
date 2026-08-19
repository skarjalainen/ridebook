import { z } from 'zod';
import { latitudeSchema, longitudeSchema, positionSchema } from './geo.js';

export const geocodingResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  position: positionSchema,
  country: z.string().nullable(),
  region: z.string().nullable(),
});

export const geocodingSearchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Search term must be at least 2 characters').max(200),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  /** Optional bias; without it "Koli" matches Chad before Finland. */
  lat: z.coerce.number().pipe(latitudeSchema).optional(),
  lon: z.coerce.number().pipe(longitudeSchema).optional(),
});

export const geocodingSearchResponseSchema = z.object({
  results: z.array(geocodingResultSchema),
});

export type GeocodingResult = z.infer<typeof geocodingResultSchema>;
export type GeocodingSearchQuery = z.infer<typeof geocodingSearchQuerySchema>;
export type GeocodingSearchResponse = z.infer<typeof geocodingSearchResponseSchema>;

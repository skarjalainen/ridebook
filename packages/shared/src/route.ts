import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema } from './common.js';
import { lineStringGeometrySchema, positionSchema } from './geo.js';

/**
 * Domain routing profiles. Provider-specific profile names (AP-003) are mapped
 * inside the routing adapter, never here.
 */
export const routingProfileSchema = z.enum(['motorcycle', 'car', 'bicycle', 'foot']);

/** How the stored geometry was produced. `imported` keeps the door open for GPX (spec 25). */
export const routeSourceSchema = z.enum(['routed', 'manual', 'imported']);

export const routeWaypointSchema = z.object({
  position: positionSchema,
  poiId: uuidSchema.nullish(),
});

export const routeSchema = z.object({
  id: uuidSchema,
  tripId: uuidSchema,
  geometry: lineStringGeometrySchema,
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  waypoints: z.array(routeWaypointSchema),
  profile: routingProfileSchema,
  source: routeSourceSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const upsertRouteSchema = z.object({
  waypoints: z.array(routeWaypointSchema).min(2, 'A route needs at least two waypoints'),
  profile: routingProfileSchema.default('motorcycle'),
});

export type RoutingProfile = z.infer<typeof routingProfileSchema>;
export type RouteSource = z.infer<typeof routeSourceSchema>;
export type RouteWaypoint = z.infer<typeof routeWaypointSchema>;
export type Route = z.infer<typeof routeSchema>;
export type UpsertRouteInput = z.infer<typeof upsertRouteSchema>;

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  apiErrorSchema,
  geocodingSearchQuerySchema,
  geocodingSearchResponseSchema,
} from '@ridebook/shared';
import { geocodingService } from '../services/geocoding.service.js';
export const geocodingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/geocoding/search',
    {
      // Every call spends provider quota, so it stays behind authorisation.
      preHandler: app.requireOwner,
      schema: {
        tags: ['geocoding'],
        summary: 'Search for places by name',
        querystring: geocodingSearchQuerySchema,
        response: {
          200: geocodingSearchResponseSchema,
          502: apiErrorSchema,
        },
      },
    },
    async (request) => {
      const { q, limit, lat, lon } = request.query;
      const near = lat !== undefined && lon !== undefined ? ([lon, lat] as const) : undefined;

      return { results: await geocodingService.search(q, limit, near) };
    },
  );
};

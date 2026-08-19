import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { poiCategorySchema } from '@ridebook/shared';
import { listPoiCategories } from '../repositories/poi-category.repository.js';

export const poiCategoryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/poi-categories',
    {
      schema: {
        tags: ['pois'],
        summary: 'List POI categories',
        response: { 200: z.array(poiCategorySchema) },
      },
    },
    async () => listPoiCategories(),
  );
};

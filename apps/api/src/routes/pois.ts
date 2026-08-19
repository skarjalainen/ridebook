import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  apiErrorSchema,
  createPoiSchema,
  listPoisQuerySchema,
  poiFeatureCollectionSchema,
  poiFeatureSchema,
  updatePoiSchema,
  uuidSchema,
} from '@ridebook/shared';
import {
  createPoi,
  deletePoi,
  getPoiById,
  listPois,
  updatePoi,
} from '../repositories/poi.repository.js';
import { notFound } from '../lib/errors.js';

const poiParamsSchema = z.object({ id: uuidSchema });

export const poiRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/pois',
    {
      schema: {
        tags: ['pois'],
        summary: 'List POIs as a GeoJSON FeatureCollection',
        querystring: listPoisQuerySchema,
        response: { 200: poiFeatureCollectionSchema },
      },
    },
    async (request) => {
      const features = await listPois(request.query);
      return { type: 'FeatureCollection' as const, features };
    },
  );

  app.get(
    '/pois/:id',
    {
      schema: {
        tags: ['pois'],
        summary: 'Get a single POI',
        params: poiParamsSchema,
        response: { 200: poiFeatureSchema, 404: apiErrorSchema },
      },
    },
    async (request) => {
      const poi = await getPoiById(request.params.id);
      if (!poi) throw notFound('POI');
      return poi;
    },
  );

  app.post(
    '/pois',
    {
      preHandler: app.requireOwner,
      schema: {
        tags: ['pois'],
        summary: 'Create a POI',
        body: createPoiSchema,
        response: { 201: poiFeatureSchema, 400: apiErrorSchema },
      },
    },
    async (request, reply) => {
      const poi = await createPoi(request.body);
      return reply.status(201).send(poi);
    },
  );

  app.patch(
    '/pois/:id',
    {
      preHandler: app.requireOwner,
      schema: {
        tags: ['pois'],
        summary: 'Update a POI',
        params: poiParamsSchema,
        body: updatePoiSchema,
        response: { 200: poiFeatureSchema, 400: apiErrorSchema, 404: apiErrorSchema },
      },
    },
    async (request) => {
      const poi = await updatePoi(request.params.id, request.body);
      if (!poi) throw notFound('POI');
      return poi;
    },
  );

  app.delete(
    '/pois/:id',
    {
      preHandler: app.requireOwner,
      schema: {
        tags: ['pois'],
        summary: 'Delete a POI',
        params: poiParamsSchema,
        response: { 204: z.null(), 404: apiErrorSchema },
      },
    },
    async (request, reply) => {
      const deleted = await deletePoi(request.params.id);
      if (!deleted) throw notFound('POI');
      return reply.status(204).send(null);
    },
  );
};

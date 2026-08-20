import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  apiErrorSchema,
  createTripSchema,
  tripSchema,
  updateTripSchema,
  uuidSchema,
} from '@ridebook/shared';
import {
  createTrip,
  deleteTrip,
  getTripById,
  listTrips,
  updateTrip,
} from '../repositories/trip.repository.js';
import { notFound } from '../lib/errors.js';

const tripParamsSchema = z.object({ id: uuidSchema });

export const tripRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/trips',
    {
      schema: {
        tags: ['trips'],
        summary: 'List trips',
        response: { 200: z.array(tripSchema) },
      },
    },
    () => listTrips(),
  );

  app.get(
    '/trips/:id',
    {
      schema: {
        tags: ['trips'],
        summary: 'Get a single trip',
        params: tripParamsSchema,
        response: { 200: tripSchema, 404: apiErrorSchema },
      },
    },
    async (request) => {
      const trip = await getTripById(request.params.id);
      if (!trip) throw notFound('Trip');
      return trip;
    },
  );

  app.post(
    '/trips',
    {
      preHandler: app.requireOwner,
      schema: {
        tags: ['trips'],
        summary: 'Create a trip',
        body: createTripSchema,
        response: { 201: tripSchema, 400: apiErrorSchema },
      },
    },
    async (request, reply) => {
      const trip = await createTrip(request.body);
      return reply.status(201).send(trip);
    },
  );

  app.patch(
    '/trips/:id',
    {
      preHandler: app.requireOwner,
      schema: {
        tags: ['trips'],
        summary: 'Update a trip',
        params: tripParamsSchema,
        body: updateTripSchema,
        response: { 200: tripSchema, 400: apiErrorSchema, 404: apiErrorSchema },
      },
    },
    async (request) => {
      const trip = await updateTrip(request.params.id, request.body);
      if (!trip) throw notFound('Trip');
      return trip;
    },
  );

  app.delete(
    '/trips/:id',
    {
      preHandler: app.requireOwner,
      schema: {
        tags: ['trips'],
        summary: 'Delete a trip',
        params: tripParamsSchema,
        response: { 204: z.null(), 404: apiErrorSchema },
      },
    },
    async (request, reply) => {
      const deleted = await deleteTrip(request.params.id);
      if (!deleted) throw notFound('Trip');
      return reply.status(204).send(null);
    },
  );
};

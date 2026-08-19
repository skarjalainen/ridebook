import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { sql } from '../db/client.js';

const healthResponseSchema = z.object({
  status: z.literal('ok'),
  database: z.object({
    connected: z.boolean(),
    postgis: z.string().nullable(),
  }),
});

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        summary: 'Service and database health',
        response: { 200: healthResponseSchema },
      },
    },
    async () => {
      let postgis: string | null = null;
      let connected = false;

      try {
        const rows = await sql<{ version: string }[]>`SELECT PostGIS_Version() AS version`;
        postgis = rows[0]?.version ?? null;
        connected = true;
      } catch (error) {
        app.log.error({ err: error }, 'database health check failed');
      }

      return { status: 'ok' as const, database: { connected, postgis } };
    },
  );
};

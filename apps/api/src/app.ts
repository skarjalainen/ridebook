import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { errorHandler } from './plugins/error-handler.js';
import { authorization } from './plugins/authorization.js';
import { healthRoutes } from './routes/health.js';
import { poiCategoryRoutes } from './routes/poi-categories.js';
import { poiRoutes } from './routes/pois.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : {}),
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });

  await app.register(swagger, {
    openapi: {
      info: { title: 'Ridebook API', version: '0.1.0' },
      servers: [{ url: `http://localhost:${env.PORT}` }],
      tags: [
        { name: 'system', description: 'Health and diagnostics' },
        { name: 'pois', description: 'Points of interest' },
        { name: 'trips', description: 'Trips and itineraries' },
        { name: 'routes', description: 'Trip routes' },
        { name: 'geocoding', description: 'Place search' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(errorHandler);
  await app.register(authorization);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(poiCategoryRoutes, { prefix: '/api' });
  await app.register(poiRoutes, { prefix: '/api' });

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;

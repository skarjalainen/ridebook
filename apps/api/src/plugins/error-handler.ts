import fp from 'fastify-plugin';
import type { FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { HttpError } from '../lib/errors.js';
import { env } from '../config/env.js';

export const errorHandler = fp(async (app) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request does not match the expected schema',
          details: error.validation,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request does not match the expected schema',
          details: error.issues,
        },
      });
    }

    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    request.log.error({ err: error }, 'unhandled error');

    return reply.status(error.statusCode ?? 500).send({
      error: {
        code: 'INTERNAL_ERROR',
        // Internal failure details are never leaked to clients in production.
        message: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      },
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    }),
  );
});

import fp from 'fastify-plugin';
import type { FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import postgres from 'postgres';
import { HttpError } from '../lib/errors.js';
import { env } from '../config/env.js';

// Constraint violations are caused by the request, not by a server fault, so they
// are reported as 4xx with a generic message — the driver's message embeds the
// full statement and must never reach the client.
const CONSTRAINT_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  '23503': {
    status: 400,
    code: 'INVALID_REFERENCE',
    message: 'A referenced record does not exist',
  },
  '23505': {
    status: 409,
    code: 'CONFLICT',
    message: 'A conflicting record already exists',
  },
  '23514': {
    status: 400,
    code: 'CONSTRAINT_VIOLATION',
    message: 'A value violates a database constraint',
  },
};

// Drizzle wraps driver failures, so the PostgresError sits on the cause chain.
const findPostgresError = (error: unknown): postgres.PostgresError | null => {
  let current: unknown = error;
  for (let depth = 0; current != null && depth < 5; depth += 1) {
    if (current instanceof postgres.PostgresError) return current;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
};

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
      // 5xx means we failed, not the caller, so keep the cause in the log.
      if (error.statusCode >= 500) request.log.error({ err: error }, 'upstream failure');

      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    const pgError = findPostgresError(error);
    if (pgError) {
      const mapped = CONSTRAINT_ERRORS[pgError.code];
      if (mapped) {
        request.log.warn(
          { err: pgError, constraint: pgError.constraint_name },
          'database constraint violation',
        );
        return reply.status(mapped.status).send({
          error: { code: mapped.code, message: mapped.message },
        });
      }
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

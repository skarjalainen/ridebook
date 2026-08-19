import fp from 'fastify-plugin';
import type { preHandlerHookHandler } from 'fastify';
import { env, isAuthConfigured } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * AP-002: every mutating route must carry this. Real identity checks land in
     * phase P8; until then it permits mutations in development only.
     */
    requireOwner: preHandlerHookHandler;
  }
}

export const authorization = fp(async (app) => {
  if (env.NODE_ENV === 'production' && !isAuthConfigured) {
    throw new Error(
      'Refusing to start: NODE_ENV=production but Google OAuth and SESSION_SECRET are not configured. ' +
        'Mutating endpoints would be unprotected.',
    );
  }

  if (!isAuthConfigured) {
    app.log.warn(
      'Authentication is not configured — mutating endpoints are OPEN. Development use only.',
    );
  }

  const requireOwner: preHandlerHookHandler = async () => {
    // Intentionally permissive until P8 wires Google OAuth and the allow-list.
  };

  app.decorate('requireOwner', requireOwner);
});

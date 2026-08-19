export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (resource: string) =>
  new HttpError(404, 'NOT_FOUND', `${resource} not found`);

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'BAD_REQUEST', message, details);

export const unauthorized = () =>
  new HttpError(401, 'UNAUTHORIZED', 'Authentication is required');

export const forbidden = () =>
  new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action');

export const conflict = (message: string) => new HttpError(409, 'CONFLICT', message);

import type { ApiError } from '@ridebook/shared';

const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    // Session lives in an httpOnly cookie, so every request must carry credentials.
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let code = 'UNKNOWN';
    let message = response.statusText;
    let details: unknown;

    try {
      const body = (await response.json()) as ApiError;
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
      details = body.error?.details;
    } catch {
      // Non-JSON error body; fall back to the status text.
    }

    throw new ApiRequestError(response.status, code, message, details);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

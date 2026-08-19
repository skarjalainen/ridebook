import { z } from 'zod';

export const uuidSchema = z.uuid();

/** ISO-8601 instant, e.g. 2026-08-17T10:15:00.000Z */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

/** Calendar date without a time component, e.g. 2026-08-22 */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

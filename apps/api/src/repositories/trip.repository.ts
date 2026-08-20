import { eq, sql } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { CreateTripInput, Trip, UpdateTripInput } from '@ridebook/shared';
import { db } from '../db/client.js';
import { trips } from '../db/schema.js';

const tripColumns = {
  id: trips.id,
  name: trips.name,
  description: trips.description,
  plannedDate: trips.plannedDate,
  drivenAt: trips.drivenAt,
  createdAt: trips.createdAt,
  updatedAt: trips.updatedAt,
};

type TripRow = {
  id: string;
  name: string;
  description: string | null;
  plannedDate: string | null;
  drivenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const toTrip = (row: TripRow): Trip => ({
  id: row.id,
  name: row.name,
  description: row.description,
  plannedDate: row.plannedDate,
  drivenAt: row.drivenAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export async function listTrips(): Promise<Trip[]> {
  const rows = await db
    .select(tripColumns)
    .from(trips)
    // Plans first, soonest at the top, then the ride history newest first.
    .orderBy(
      sql`(${trips.drivenAt} IS NOT NULL), ${trips.plannedDate} ASC NULLS LAST, ${trips.drivenAt} DESC, ${trips.createdAt} DESC`,
    );

  return rows.map(toTrip);
}

export async function getTripById(id: string): Promise<Trip | null> {
  const rows = await db.select(tripColumns).from(trips).where(eq(trips.id, id)).limit(1);
  const row = rows[0];
  return row ? toTrip(row) : null;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const rows = await db
    .insert(trips)
    .values({
      name: input.name,
      description: input.description ?? null,
      plannedDate: input.plannedDate ?? null,
      drivenAt: input.drivenAt ? new Date(input.drivenAt) : null,
    })
    .returning(tripColumns);

  const row = rows[0];
  if (!row) {
    throw new Error('Insert of trip returned no row');
  }
  return toTrip(row);
}

export async function updateTrip(id: string, input: UpdateTripInput): Promise<Trip | null> {
  const values: PgUpdateSetSource<typeof trips> = {};

  if (input.name !== undefined) values.name = input.name;
  if (input.description !== undefined) values.description = input.description ?? null;
  if (input.plannedDate !== undefined) values.plannedDate = input.plannedDate ?? null;
  if (input.drivenAt !== undefined) {
    values.drivenAt = input.drivenAt ? new Date(input.drivenAt) : null;
  }

  if (Object.keys(values).length === 0) {
    return getTripById(id);
  }

  // updated_at is maintained by the set_updated_at trigger.
  const rows = await db.update(trips).set(values).where(eq(trips.id, id)).returning(tripColumns);

  const row = rows[0];
  return row ? toTrip(row) : null;
}

export async function deleteTrip(id: string): Promise<boolean> {
  const rows = await db.delete(trips).where(eq(trips.id, id)).returning({ id: trips.id });
  return rows.length > 0;
}

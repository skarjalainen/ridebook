import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type {
  CreatePoiInput,
  ListPoisQuery,
  PoiFeature,
  PointGeometry,
  UpdatePoiInput,
} from '@ridebook/shared';
import { db } from '../db/client.js';
import { pois } from '../db/schema.js';

const poiColumns = {
  id: pois.id,
  categoryId: pois.categoryId,
  name: pois.name,
  description: pois.description,
  visitedAt: pois.visitedAt,
  createdAt: pois.createdAt,
  updatedAt: pois.updatedAt,
  geojson: sql<string>`ST_AsGeoJSON(${pois.location})`,
};

type PoiRow = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  visitedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  geojson: string;
};

const toFeature = (row: PoiRow): PoiFeature => ({
  type: 'Feature',
  id: row.id,
  geometry: JSON.parse(row.geojson) as PointGeometry,
  properties: {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    description: row.description,
    visitedAt: row.visitedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  },
});

// ST_GeomFromGeoJSON already yields SRID 4326, but stating it keeps the column
// constraint satisfied even if PostGIS defaults ever change.
const toGeometry = (geometry: PointGeometry): SQL =>
  sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326)`;

export async function listPois(query: ListPoisQuery): Promise<PoiFeature[]> {
  const filters: SQL[] = [];

  if (query.categoryId) {
    filters.push(eq(pois.categoryId, query.categoryId));
  }

  if (query.bbox) {
    const [minLon, minLat, maxLon, maxLat] = query.bbox;
    filters.push(
      sql`ST_Intersects(${pois.location}, ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326))`,
    );
  }

  const rows = await db
    .select(poiColumns)
    .from(pois)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(pois.createdAt));

  return rows.map(toFeature);
}

export async function getPoiById(id: string): Promise<PoiFeature | null> {
  const rows = await db.select(poiColumns).from(pois).where(eq(pois.id, id)).limit(1);
  const row = rows[0];
  return row ? toFeature(row) : null;
}

export async function createPoi(input: CreatePoiInput): Promise<PoiFeature> {
  const rows = await db
    .insert(pois)
    .values({
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      location: toGeometry(input.location),
      visitedAt: input.visitedAt ? new Date(input.visitedAt) : null,
    })
    .returning(poiColumns);

  const row = rows[0];
  if (!row) {
    throw new Error('Insert of POI returned no row');
  }
  return toFeature(row);
}

export async function updatePoi(id: string, input: UpdatePoiInput): Promise<PoiFeature | null> {
  const values: PgUpdateSetSource<typeof pois> = {};

  if (input.categoryId !== undefined) values.categoryId = input.categoryId;
  if (input.name !== undefined) values.name = input.name;
  if (input.description !== undefined) values.description = input.description ?? null;
  if (input.location !== undefined) values.location = toGeometry(input.location);
  if (input.visitedAt !== undefined) {
    values.visitedAt = input.visitedAt ? new Date(input.visitedAt) : null;
  }

  if (Object.keys(values).length === 0) {
    return getPoiById(id);
  }

  // updated_at is maintained by the set_updated_at trigger.
  const rows = await db.update(pois).set(values).where(eq(pois.id, id)).returning(poiColumns);

  const row = rows[0];
  return row ? toFeature(row) : null;
}

export async function deletePoi(id: string): Promise<boolean> {
  const rows = await db.delete(pois).where(eq(pois.id, id)).returning({ id: pois.id });
  return rows.length > 0;
}

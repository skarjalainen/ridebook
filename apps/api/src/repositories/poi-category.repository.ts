import { asc } from 'drizzle-orm';
import type { PoiCategory } from '@ridebook/shared';
import { db } from '../db/client.js';
import { poiCategories } from '../db/schema.js';

export async function listPoiCategories(): Promise<PoiCategory[]> {
  const rows = await db
    .select()
    .from(poiCategories)
    .orderBy(asc(poiCategories.sortOrder), asc(poiCategories.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

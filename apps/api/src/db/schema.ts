import { customType, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { PointGeometry } from '@ridebook/shared';

// Values never cross this boundary as WKB: reads go through ST_AsGeoJSON and
// writes through ST_GeomFromGeoJSON, so no driver codecs are needed here.
const pointGeometry = customType<{ data: PointGeometry; driverData: string }>({
  dataType: () => 'geometry(Point, 4326)',
});

export const poiCategories = pgTable('poi_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pois = pgTable('pois', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => poiCategories.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  description: text('description'),
  location: pointGeometry('location').notNull(),
  visitedAt: timestamp('visited_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

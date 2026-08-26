import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const districtStatuses = pgTable('district_statuses', {
  districtId: text('district_id').primaryKey(),
  isVisited: boolean('is_visited').notNull().default(false),
  generalNotes: text('general_notes'),
  photos: text('photos'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const places = pgTable(
  'places',
  {
    id: text('id').primaryKey(),
    districtId: text('district_id')
      .notNull()
      .references(() => districtStatuses.districtId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull().default('Other'),
    visitedDate: text('visited_date'),
    notes: text('notes'),
    photos: text('photos'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    districtIdIdx: index('places_district_id_idx').on(table.districtId),
    categoryIdx: index('places_category_idx').on(table.category),
  })
);

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const districtStatusesRelations = relations(districtStatuses, ({ many }) => ({
  places: many(places),
}));

export const placesRelations = relations(places, ({ one }) => ({
  district: one(districtStatuses, {
    fields: [places.districtId],
    references: [districtStatuses.districtId],
  }),
}));

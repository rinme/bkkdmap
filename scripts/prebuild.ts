import { getDb, getDbUrl } from '../lib/db';
import { districtStatuses, places } from '../lib/db/schema';
import { sql } from 'drizzle-orm';
import initialStateJson from '../data/initial-state.json';
import { bangkokDistricts } from '../lib/districts-data';

export async function prebuild() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.log('ℹ️ No DATABASE_URL or POSTGRES_URL configured. Skipping database setup in prebuild.');
    return;
  }

  const db = getDb();
  if (!db) {
    console.warn('⚠️ Could not initialize database client in prebuild.');
    return;
  }

  console.log('🚀 Running database prebuild check & migration...');

  try {
    // 1. Ensure tables exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS district_statuses (
        district_id text PRIMARY KEY,
        is_visited boolean NOT NULL DEFAULT false,
        general_notes text,
        photos text,
        updated_at timestamp NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      ALTER TABLE district_statuses ADD COLUMN IF NOT EXISTS photos text;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS places (
        id text PRIMARY KEY,
        district_id text NOT NULL REFERENCES district_statuses(district_id) ON DELETE CASCADE,
        name text NOT NULL,
        category text NOT NULL DEFAULT 'Other',
        visited_date text,
        notes text,
        photos text,
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      ALTER TABLE places ADD COLUMN IF NOT EXISTS photos text;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamp NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS uploaded_images (
        id text PRIMARY KEY,
        district_id text NOT NULL,
        filename text NOT NULL UNIQUE,
        mime_type text NOT NULL,
        data text NOT NULL,
        size text NOT NULL DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS places_district_id_idx ON places(district_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS places_category_idx ON places(category);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS uploaded_images_filename_idx ON uploaded_images(filename);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS uploaded_images_district_idx ON uploaded_images(district_id);
    `);

    console.log('✅ Database tables and indexes verified.');

    // 2. Check if districts table has existing data
    const existingStatuses = await db.select().from(districtStatuses);

    if (existingStatuses.length === 0) {
      console.log('🌱 Empty database detected during build. Seeding initial 50 districts...');
      const districtsData = (initialStateJson as any).districts || {};

      for (const d of bangkokDistricts) {
        const existing = districtsData[d.id] || { isVisited: false, visitedPlaces: [] };

        await db.insert(districtStatuses).values({
          districtId: d.id,
          isVisited: Boolean(existing.isVisited),
          generalNotes: existing.generalNotes || null,
          updatedAt: new Date(),
        }).onConflictDoNothing();

        if (existing.visitedPlaces && existing.visitedPlaces.length > 0) {
          for (const p of existing.visitedPlaces) {
            await db.insert(places).values({
              id: p.id,
              districtId: d.id,
              name: p.name,
              category: p.category || 'Other',
              visitedDate: p.visitedDate || null,
              notes: p.notes || null,
            }).onConflictDoNothing();
          }
        }
      }
      console.log('✅ Initial database seed completed.');
    } else {
      // If table exists, ensure all 50 district IDs are present without overwriting user data
      for (const d of bangkokDistricts) {
        await db.insert(districtStatuses).values({
          districtId: d.id,
          isVisited: false,
          generalNotes: null,
          updatedAt: new Date(),
        }).onConflictDoNothing();
      }
      console.log(`✅ Database ready (${existingStatuses.length} districts exist, preserved existing state).`);
    }
  } catch (err) {
    console.error('⚠️ Prebuild database setup warning (will proceed with build):', err);
  }
}

if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  prebuild()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Prebuild error:', err);
      process.exit(0); // Exit 0 so build doesn't hard-crash if DB is temporarily unreachable
    });
}

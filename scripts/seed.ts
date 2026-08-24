import { getDb, getDbUrl } from '../lib/db';
import { districtStatuses, places } from '../lib/db/schema';
import initialStateJson from '../data/initial-state.json';
import { bangkokDistricts } from '../lib/districts-data';

export async function seedDatabase() {
  const db = getDb();
  if (!db) {
    console.warn('⚠️ No DATABASE_URL or POSTGRES_URL configured. Skipping database seed.');
    return false;
  }

  console.log('🌱 Starting Vercel Postgres seed...');

  const districtsData = (initialStateJson as any).districts || {};

  // 1. Prepare district status rows for all 50 districts
  for (const d of bangkokDistricts) {
    const existing = districtsData[d.id] || { isVisited: false, visitedPlaces: [] };

    await db
      .insert(districtStatuses)
      .values({
        districtId: d.id,
        isVisited: Boolean(existing.isVisited),
        generalNotes: existing.generalNotes || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: districtStatuses.districtId,
        set: {
          isVisited: Boolean(existing.isVisited),
          generalNotes: existing.generalNotes || null,
          updatedAt: new Date(),
        },
      });

    // 2. Insert places for this district
    if (existing.visitedPlaces && existing.visitedPlaces.length > 0) {
      for (const p of existing.visitedPlaces) {
        await db
          .insert(places)
          .values({
            id: p.id,
            districtId: d.id,
            name: p.name,
            category: p.category || 'Other',
            visitedDate: p.visitedDate || null,
            notes: p.notes || null,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log('✅ Seed completed successfully for all 50 districts.');
  return true;
}

// Auto-run if executed directly via CLI
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}

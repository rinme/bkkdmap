# Vercel Postgres Migration & Performance Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Bangkok 50 Districts Tracker from Redis/KV REST to Vercel Postgres (Neon Serverless + Drizzle ORM) with multi-layer performance caching (Next.js server-side tagged cache + client-side SWR with 0ms optimistic UI).

**Architecture:** Replace the legacy REST Redis adapter in `lib/storage.ts` with a normalized Drizzle ORM schema (`district_statuses` & `places`) connected to Vercel Postgres via `@neondatabase/serverless`. Wrap reads in Next.js `unstable_cache` with `revalidateTag('districts-state')` purged on mutations, and integrate SWR on the client with optimistic updates for 0ms interaction response. Maintain a resilient local JSON fallback when `DATABASE_URL` is unset.

**Tech Stack:** Next.js 14 (App Router), Drizzle ORM 0.38+, `@neondatabase/serverless` 0.10+, `drizzle-kit`, `swr` 2.3+, TypeScript, Bun.

**Spec:** `docs/superpowers/specs/2026-08-24-vercel-postgres-migration-design.md`

## Global Constraints
- Target database: Vercel Postgres / Neon Serverless with connection pooling
- ORM: Drizzle ORM with schema defined in `lib/db/schema.ts`
- Caching: Next.js `unstable_cache` with tag `districts-state` + SWR on the client
- Graceful degradation: Must transparently fallback to local JSON file when `DATABASE_URL` / `POSTGRES_URL` is absent
- Zero breaking changes to `FullDistrict`, `TrackerStats`, `Place`, and API route interfaces

---

### Task 1: Install Dependencies, Drizzle Config, Schema & Database Client

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`

**Interfaces:**
- Produces:
  - `districtStatuses` table in `lib/db/schema.ts`
  - `places` table in `lib/db/schema.ts`
  - `getDb()` returning Drizzle client or `null` in `lib/db/index.ts`

- [ ] **Step 1: Install dependencies**

Run:
```bash
bun add drizzle-orm @neondatabase/serverless swr
bun add -d drizzle-kit
```

- [ ] **Step 2: Create Drizzle configuration (`drizzle.config.ts`)**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
});
```

- [ ] **Step 3: Create database schema definition (`lib/db/schema.ts`)**

```typescript
import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const districtStatuses = pgTable('district_statuses', {
  districtId: text('district_id').primaryKey(),
  isVisited: boolean('is_visited').notNull().default(false),
  generalNotes: text('general_notes'),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    districtIdIdx: index('places_district_id_idx').on(table.districtId),
    categoryIdx: index('places_category_idx').on(table.category),
  })
);

export const districtStatusesRelations = relations(districtStatuses, ({ many }) => ({
  places: many(places),
}));

export const placesRelations = relations(places, ({ one }) => ({
  district: one(districtStatuses, {
    fields: [places.districtId],
    references: [districtStatuses.districtId],
  }),
}));
```

- [ ] **Step 4: Create Database Connection Layer (`lib/db/index.ts`)**

```typescript
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Enable connection cache for serverless edge
neonConfig.fetchConnectionCache = true;

export function getDbUrl(): string | null {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}

export function getDb() {
  const connectionString = getDbUrl();
  if (!connectionString) {
    return null;
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export type DbClient = ReturnType<typeof getDb>;
```

- [ ] **Step 5: Verify build compiles**

Run: `bun run build`
Expected: Build succeeds.

---

### Task 2: Database Seed Script & Package Scripts

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `seedDatabase(db)` function to populate initial 50 districts and default places
  - `bun run db:push` command
  - `bun run db:seed` command

- [ ] **Step 1: Create Seed Script (`scripts/seed.ts`)**

```typescript
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
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}
```

- [ ] **Step 2: Add database scripts to `package.json`**

In `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:push": "drizzle-kit push",
  "db:seed": "bun run scripts/seed.ts",
  "db:studio": "drizzle-kit studio"
}
```

---

### Task 3: Refactor Storage Layer (`lib/storage.ts`) with Postgres & Next.js Tagged Cache

**Files:**
- Modify: `lib/storage.ts`

**Interfaces:**
- Consumes:
  - `getDb()` from `lib/db`
  - `districtStatuses`, `places` from `lib/db/schema`
- Produces:
  - `getTrackerState(): Promise<TrackerState>` (cached via `unstable_cache`)
  - `toggleDistrictVisited(districtId, visited)`
  - `addPlaceToDistrict(districtId, place)`
  - `updatePlaceInDistrict(districtId, placeId, data)`
  - `deletePlaceFromDistrict(districtId, placeId)`
  - `updateDistrictNotes(districtId, notes)`
  - `resetTrackerState()`

- [ ] **Step 1: Rewrite `lib/storage.ts` with Postgres, Auto-Seeding, Tagged Caching & Local Fallback**

Replace `lib/storage.ts` with:
```typescript
import fs from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { getDb } from './db';
import { districtStatuses, places } from './db/schema';
import initialStateJson from '../data/initial-state.json';
import { bangkokDistricts } from './districts-data';
import { Place, DistrictUserData, TrackerState } from './types';

const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'bangkok-tracker-state.json');

// In-memory fallback singleton
let memoryStateCache: TrackerState | null = null;

function getInitialDefaultState(): TrackerState {
  return JSON.parse(JSON.stringify(initialStateJson)) as TrackerState;
}

// ----------------------------------------------------
// Local File Fallback Handlers
// ----------------------------------------------------
function getFromFile(): TrackerState | null {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      return JSON.parse(raw) as TrackerState;
    }
  } catch (err) {
    console.warn('Local file read warning:', err);
  }
  return null;
}

function saveToFile(state: TrackerState): boolean {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Local file write warning:', err);
    return false;
  }
}

// ----------------------------------------------------
// Postgres Core State Loader with Auto-Seed
// ----------------------------------------------------
async function fetchStateFromPostgres(): Promise<TrackerState | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const allStatuses = await db.select().from(districtStatuses);

    // Auto-seed if database is empty
    if (allStatuses.length === 0) {
      console.log('⚡ Empty database detected. Auto-seeding initial district data...');
      const defaultState = getInitialDefaultState();
      for (const d of bangkokDistricts) {
        const existing = defaultState.districts[d.id] || { isVisited: false, visitedPlaces: [] };
        await db.insert(districtStatuses).values({
          districtId: d.id,
          isVisited: Boolean(existing.isVisited),
          generalNotes: existing.generalNotes || null,
        }).onConflictDoNothing();

        for (const p of existing.visitedPlaces || []) {
          await db.insert(places).values({
            id: p.id,
            districtId: d.id,
            name: p.name,
            category: p.category,
            visitedDate: p.visitedDate,
            notes: p.notes,
          }).onConflictDoNothing();
        }
      }
      return defaultState;
    }

    // Fetch all places
    const allPlaces = await db.select().from(places).orderBy(desc(places.createdAt));

    // Construct districts map
    const districtsMap: Record<string, DistrictUserData> = {};

    // Initialize all 50 districts
    for (const d of bangkokDistricts) {
      districtsMap[d.id] = {
        isVisited: false,
        visitedPlaces: [],
      };
    }

    // Populate statuses
    for (const status of allStatuses) {
      if (districtsMap[status.districtId]) {
        districtsMap[status.districtId].isVisited = status.isVisited;
        if (status.generalNotes) {
          districtsMap[status.districtId].generalNotes = status.generalNotes;
        }
      }
    }

    // Populate places
    for (const p of allPlaces) {
      if (districtsMap[p.districtId]) {
        districtsMap[p.districtId].visitedPlaces.push({
          id: p.id,
          name: p.name,
          category: p.category as any,
          visitedDate: p.visitedDate || undefined,
          notes: p.notes || undefined,
        });
      }
    }

    return {
      districts: districtsMap,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Postgres state fetch error:', err);
    return null;
  }
}

// ----------------------------------------------------
// Next.js Tagged Server Cache
// ----------------------------------------------------
const getCachedState = unstable_cache(
  async () => {
    // 1. Try Postgres
    const pgData = await fetchStateFromPostgres();
    if (pgData && pgData.districts) {
      memoryStateCache = pgData;
      return pgData;
    }

    // 2. Try In-Memory Cache
    if (memoryStateCache) {
      return memoryStateCache;
    }

    // 3. Try Local File
    const fileData = getFromFile();
    if (fileData && fileData.districts) {
      memoryStateCache = fileData;
      return fileData;
    }

    // 4. Default Fallback
    const fallback = getInitialDefaultState();
    memoryStateCache = fallback;
    saveToFile(fallback);
    return fallback;
  },
  ['tracker-state-cache-v2'],
  { tags: ['districts-state'], revalidate: 3600 }
);

export async function getTrackerState(): Promise<TrackerState> {
  return await getCachedState();
}

// ----------------------------------------------------
// Mutation Handlers
// ----------------------------------------------------
export async function toggleDistrictVisited(districtId: string, visited?: boolean): Promise<TrackerState> {
  const db = getDb();
  const state = await getTrackerState();
  const currentStatus = state.districts[districtId] || { isVisited: false, visitedPlaces: [] };
  const newVisited = visited !== undefined ? visited : !currentStatus.isVisited;

  if (db) {
    try {
      await db
        .insert(districtStatuses)
        .values({
          districtId,
          isVisited: newVisited,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: districtStatuses.districtId,
          set: {
            isVisited: newVisited,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error('Postgres toggleDistrictVisited error:', err);
    }
  }

  // Update in-memory & local fallback
  currentStatus.isVisited = newVisited;
  state.districts[districtId] = currentStatus;
  state.lastUpdated = new Date().toISOString();
  memoryStateCache = state;
  saveToFile(state);

  return state;
}

export async function addPlaceToDistrict(
  districtId: string,
  placeInput: Omit<Place, 'id'>
): Promise<{ state: TrackerState; place: Place }> {
  const db = getDb();
  const state = await getTrackerState();
  const districtData = state.districts[districtId] || { isVisited: false, visitedPlaces: [] };

  const newPlace: Place = {
    id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: placeInput.name.trim(),
    category: placeInput.category || 'Other',
    visitedDate: placeInput.visitedDate || new Date().toISOString().split('T')[0],
    notes: placeInput.notes?.trim() || '',
  };

  if (db) {
    try {
      // Ensure district status row exists & auto-mark visited
      await db
        .insert(districtStatuses)
        .values({
          districtId,
          isVisited: true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: districtStatuses.districtId,
          set: {
            isVisited: true,
            updatedAt: new Date(),
          },
        });

      // Insert place row
      await db.insert(places).values({
        id: newPlace.id,
        districtId,
        name: newPlace.name,
        category: newPlace.category,
        visitedDate: newPlace.visitedDate,
        notes: newPlace.notes,
      });
    } catch (err) {
      console.error('Postgres addPlaceToDistrict error:', err);
    }
  }

  // Update memory & local file
  districtData.visitedPlaces = [newPlace, ...(districtData.visitedPlaces || [])];
  districtData.isVisited = true;
  state.districts[districtId] = districtData;
  state.lastUpdated = new Date().toISOString();
  memoryStateCache = state;
  saveToFile(state);

  return { state, place: newPlace };
}

export async function updatePlaceInDistrict(
  districtId: string,
  placeId: string,
  placeData: Partial<Place>
): Promise<TrackerState> {
  const db = getDb();
  const state = await getTrackerState();
  const districtData = state.districts[districtId];

  if (db) {
    try {
      await db
        .update(places)
        .set({
          name: placeData.name !== undefined ? placeData.name.trim() : undefined,
          category: placeData.category,
          visitedDate: placeData.visitedDate,
          notes: placeData.notes !== undefined ? placeData.notes.trim() : undefined,
        })
        .where(eq(places.id, placeId));
    } catch (err) {
      console.error('Postgres updatePlaceInDistrict error:', err);
    }
  }

  if (districtData && districtData.visitedPlaces) {
    districtData.visitedPlaces = districtData.visitedPlaces.map((p) => {
      if (p.id === placeId) {
        return {
          ...p,
          ...placeData,
          name: placeData.name !== undefined ? placeData.name.trim() : p.name,
          notes: placeData.notes !== undefined ? placeData.notes.trim() : p.notes,
        };
      }
      return p;
    });
    state.districts[districtId] = districtData;
    state.lastUpdated = new Date().toISOString();
    memoryStateCache = state;
    saveToFile(state);
  }

  return state;
}

export async function deletePlaceFromDistrict(districtId: string, placeId: string): Promise<TrackerState> {
  const db = getDb();
  const state = await getTrackerState();
  const districtData = state.districts[districtId];

  if (db) {
    try {
      await db.delete(places).where(eq(places.id, placeId));
    } catch (err) {
      console.error('Postgres deletePlaceFromDistrict error:', err);
    }
  }

  if (districtData && districtData.visitedPlaces) {
    districtData.visitedPlaces = districtData.visitedPlaces.filter((p) => p.id !== placeId);
    if (districtData.visitedPlaces.length === 0) {
      districtData.isVisited = false;
      if (db) {
        try {
          await db
            .update(districtStatuses)
            .set({ isVisited: false, updatedAt: new Date() })
            .where(eq(districtStatuses.districtId, districtId));
        } catch (err) {
          console.error('Postgres unvisit district error:', err);
        }
      }
    }
    state.districts[districtId] = districtData;
    state.lastUpdated = new Date().toISOString();
    memoryStateCache = state;
    saveToFile(state);
  }

  return state;
}

export async function updateDistrictNotes(districtId: string, notes: string): Promise<TrackerState> {
  const db = getDb();
  const state = await getTrackerState();
  const districtData = state.districts[districtId] || { isVisited: false, visitedPlaces: [] };

  if (db) {
    try {
      await db
        .insert(districtStatuses)
        .values({
          districtId,
          generalNotes: notes,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: districtStatuses.districtId,
          set: {
            generalNotes: notes,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error('Postgres updateDistrictNotes error:', err);
    }
  }

  districtData.generalNotes = notes;
  state.districts[districtId] = districtData;
  state.lastUpdated = new Date().toISOString();
  memoryStateCache = state;
  saveToFile(state);

  return state;
}

export async function resetTrackerState(): Promise<TrackerState> {
  const db = getDb();
  const defaultState = getInitialDefaultState();

  if (db) {
    try {
      await db.delete(places);
      await db.delete(districtStatuses);
      // Re-seed defaults
      for (const d of bangkokDistricts) {
        const existing = defaultState.districts[d.id] || { isVisited: false, visitedPlaces: [] };
        await db.insert(districtStatuses).values({
          districtId: d.id,
          isVisited: Boolean(existing.isVisited),
          generalNotes: existing.generalNotes || null,
        });

        for (const p of existing.visitedPlaces || []) {
          await db.insert(places).values({
            id: p.id,
            districtId: d.id,
            name: p.name,
            category: p.category,
            visitedDate: p.visitedDate,
            notes: p.notes,
          });
        }
      }
    } catch (err) {
      console.error('Postgres reset error:', err);
    }
  }

  memoryStateCache = defaultState;
  saveToFile(defaultState);
  return defaultState;
}

export async function saveTrackerState(state: TrackerState): Promise<boolean> {
  state.lastUpdated = new Date().toISOString();
  memoryStateCache = state;
  saveToFile(state);
  return true;
}
```

---

### Task 4: Cache Revalidation in Next.js Route Handlers

**Files:**
- Modify: `app/api/districts/route.ts`
- Modify: `app/api/reset/route.ts`
- Modify: `app/api/import/route.ts`

**Interfaces:**
- Consumes: `revalidateTag('districts-state')` from `next/cache`

- [ ] **Step 1: Update `app/api/districts/route.ts` with `revalidateTag` on all mutations**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import {
  getTrackerState,
  toggleDistrictVisited,
  addPlaceToDistrict,
  updatePlaceInDistrict,
  deletePlaceFromDistrict,
  updateDistrictNotes,
} from '@/lib/storage';
import { assembleFullDistricts, computeTrackerStats } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getTrackerState();
    const districts = assembleFullDistricts(state);
    const stats = computeTrackerStats(districts);
    return NextResponse.json({ state, districts, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    let updatedState = await getTrackerState();

    if (action === 'toggle_visited') {
      const { districtId, isVisited } = body;
      updatedState = await toggleDistrictVisited(districtId, isVisited);
    } else if (action === 'add_place') {
      const { districtId, place } = body;
      const res = await addPlaceToDistrict(districtId, place);
      updatedState = res.state;
    } else if (action === 'update_place') {
      const { districtId, placeId, placeData } = body;
      updatedState = await updatePlaceInDistrict(districtId, placeId, placeData);
    } else if (action === 'delete_place') {
      const { districtId, placeId } = body;
      updatedState = await deletePlaceFromDistrict(districtId, placeId);
    } else if (action === 'update_notes') {
      const { districtId, notes } = body;
      updatedState = await updateDistrictNotes(districtId, notes);
    }

    // Invalidate server cache tag instantly
    revalidateTag('districts-state');

    const districts = assembleFullDistricts(updatedState);
    const stats = computeTrackerStats(districts);

    return NextResponse.json({ success: true, state: updatedState, districts, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Mutation failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update `app/api/reset/route.ts` and `app/api/import/route.ts` with `revalidateTag`**

In `app/api/reset/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { resetTrackerState } from '@/lib/storage';
import { assembleFullDistricts, computeTrackerStats } from '@/lib/utils';

export async function POST() {
  try {
    const state = await resetTrackerState();
    revalidateTag('districts-state');
    const districts = assembleFullDistricts(state);
    const stats = computeTrackerStats(districts);
    return NextResponse.json({ success: true, state, districts, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset failed' }, { status: 500 });
  }
}
```

In `app/api/import/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { saveTrackerState, getTrackerState } from '@/lib/storage';
import { assembleFullDistricts, computeTrackerStats } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    if (!json || !json.districts) {
      return NextResponse.json({ error: 'Invalid tracker state JSON structure' }, { status: 400 });
    }
    await saveTrackerState(json);
    revalidateTag('districts-state');
    const state = await getTrackerState();
    const districts = assembleFullDistricts(state);
    const stats = computeTrackerStats(districts);
    return NextResponse.json({ success: true, state, districts, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}
```

---

### Task 5: Client-Side SWR Data Fetching & Optimistic UI Updates

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `useSWR` from `swr`

- [ ] **Step 1: Update `app/page.tsx` with SWR caching**

Replace manual `useEffect` with `useSWR('/api/districts')` for automatic deduplication, background revalidation, and fast navigation.

- [ ] **Step 2: Update `app/admin/page.tsx` with SWR and Optimistic UI updates**

Wrap mutations (`handleToggleVisited`, `handlePlaceAdded`, `handlePlaceDeleted`) with SWR's `mutate('/api/districts', optimisticData, { rollbackOnError: true })` so toggles and spot additions reflect in 0ms on the screen.

---

### Task 6: Full Verification & Build Check

**Files:**
- All modified files

- [ ] **Step 1: Run `bun run build`**

Run: `bun run build`
Expected: 12/12 static & dynamic routes compile cleanly with zero TypeScript errors.

- [ ] **Step 2: Test CLI seed runner**

Run: `bun run db:seed`
Expected: Executes without crash (outputs database seed status or graceful skip if no `DATABASE_URL`).

import fs from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb } from './db';
import { districtStatuses, places, appSettings } from './db/schema';
import initialStateJson from '../data/initial-state.json';
import { bangkokDistricts } from './districts-data';
import { Place, DistrictUserData, TrackerState, AppSettings, DEFAULT_APP_SETTINGS } from './types';

const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'bangkok-tracker-state.json');
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'app-settings.json');

// In-memory fallback singleton
let memoryStateCache: TrackerState | null = null;
let memorySettingsCache: AppSettings | null = null;
let tablesInitialized = false;

function parsePhotos(photosRaw: string | null | undefined): string[] | undefined {
  if (!photosRaw) return undefined;
  try {
    const parsed = JSON.parse(photosRaw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    if (typeof photosRaw === 'string' && photosRaw.trim().length > 0) {
      return [photosRaw.trim()];
    }
  }
  return undefined;
}

function serializePhotos(photos: string[] | undefined | null): string | null {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return null;
  return JSON.stringify(photos);
}

function getSettingsFromFile(): AppSettings | null {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(raw) as AppSettings;
    }
  } catch (err) {
    console.warn('Local settings file read warning:', err);
  }
  return null;
}

function saveSettingsToFile(settings: AppSettings): boolean {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Local settings file write warning:', err);
    return false;
  }
}

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
// Auto-DDL: Create Tables If Not Exist
// ----------------------------------------------------
async function ensureTablesExist(db: NonNullable<ReturnType<typeof getDb>>): Promise<void> {
  if (tablesInitialized) return;
  try {
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
      CREATE INDEX IF NOT EXISTS places_district_id_idx ON places(district_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS places_category_idx ON places(category);
    `);

    tablesInitialized = true;
  } catch (err) {
    console.error('Error ensuring Postgres tables exist:', err);
  }
}

// ----------------------------------------------------
// App Settings Getters & Mutators
// ----------------------------------------------------
export async function getAppSettings(): Promise<AppSettings> {
  const db = getDb();
  if (db) {
    try {
      await ensureTablesExist(db);
      const rows = await db.select().from(appSettings).where(eq(appSettings.key, 'settings'));
      if (rows.length > 0 && rows[0].value) {
        const parsed = JSON.parse(rows[0].value);
        const merged: AppSettings = { ...DEFAULT_APP_SETTINGS, ...parsed };
        memorySettingsCache = merged;
        return merged;
      }
    } catch (err) {
      console.error('Postgres getAppSettings error:', err);
    }
  }

  if (memorySettingsCache) {
    return memorySettingsCache;
  }

  const fileSettings = getSettingsFromFile();
  if (fileSettings) {
    const merged: AppSettings = { ...DEFAULT_APP_SETTINGS, ...fileSettings };
    memorySettingsCache = merged;
    return merged;
  }

  memorySettingsCache = { ...DEFAULT_APP_SETTINGS };
  saveSettingsToFile(memorySettingsCache);
  return memorySettingsCache;
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
  };

  const db = getDb();
  if (db) {
    try {
      await ensureTablesExist(db);
      await db
        .insert(appSettings)
        .values({
          key: 'settings',
          value: JSON.stringify(updated),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: {
            value: JSON.stringify(updated),
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error('Postgres saveAppSettings error:', err);
    }
  }

  memorySettingsCache = updated;
  saveSettingsToFile(updated);
  return updated;
}

// ----------------------------------------------------
// Postgres Core State Loader with Auto-Seed
// ----------------------------------------------------
async function fetchStateFromPostgres(): Promise<TrackerState | null> {
  const db = getDb();
  if (!db) return null;

  try {
    await ensureTablesExist(db);

    const allStatuses = await db.select().from(districtStatuses);

    // Auto-seed if database is empty
    if (allStatuses.length === 0) {
      console.log('⚡ Empty database detected. Auto-seeding initial district data into Postgres...');
      const defaultState = getInitialDefaultState();
      for (const d of bangkokDistricts) {
        const existing = defaultState.districts[d.id] || { isVisited: false, visitedPlaces: [] };
        await db.insert(districtStatuses).values({
          districtId: d.id,
          isVisited: Boolean(existing.isVisited),
          generalNotes: existing.generalNotes || null,
          photos: serializePhotos(existing.photos),
        }).onConflictDoNothing();

        for (const p of existing.visitedPlaces || []) {
          await db.insert(places).values({
            id: p.id,
            districtId: d.id,
            name: p.name,
            category: p.category,
            visitedDate: p.visitedDate,
            notes: p.notes,
            photos: serializePhotos(p.photos),
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
        const parsedPhotos = parsePhotos(status.photos);
        if (parsedPhotos && parsedPhotos.length > 0) {
          districtsMap[status.districtId].photos = parsedPhotos;
        }
      }
    }

    // Populate places
    for (const p of allPlaces) {
      if (districtsMap[p.districtId]) {
        const parsedPlacePhotos = parsePhotos(p.photos);
        districtsMap[p.districtId].visitedPlaces.push({
          id: p.id,
          name: p.name,
          category: p.category as any,
          visitedDate: p.visitedDate || undefined,
          notes: p.notes || undefined,
          photos: parsedPlacePhotos && parsedPlacePhotos.length > 0 ? parsedPlacePhotos : undefined,
        });
      }
    }

    return {
      version: '1.0.0',
      districts: districtsMap,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Postgres state fetch error:', err);
    return null;
  }
}

// ----------------------------------------------------
// Unified Raw State Fetcher
// ----------------------------------------------------
export async function fetchRawTrackerState(): Promise<TrackerState> {
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
}

// ----------------------------------------------------
// Next.js Tag Server Cache
// ----------------------------------------------------
let cachedFetcher: (() => Promise<TrackerState>) | null = null;
try {
  cachedFetcher = unstable_cache(
    fetchRawTrackerState,
    ['tracker-state-cache-v2'],
    { tags: ['districts-state'], revalidate: 3600 }
  );
} catch {
  cachedFetcher = null;
}

export async function getTrackerState(): Promise<TrackerState> {
  if (cachedFetcher) {
    try {
      return await cachedFetcher();
    } catch {
      return await fetchRawTrackerState();
    }
  }
  return await fetchRawTrackerState();
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
      await ensureTablesExist(db);
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
    photos: placeInput.photos && placeInput.photos.length > 0 ? placeInput.photos : undefined,
  };

  if (db) {
    try {
      await ensureTablesExist(db);
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
        photos: serializePhotos(newPlace.photos),
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
      await ensureTablesExist(db);
      await db
        .update(places)
        .set({
          name: placeData.name !== undefined ? placeData.name.trim() : undefined,
          category: placeData.category,
          visitedDate: placeData.visitedDate,
          notes: placeData.notes !== undefined ? placeData.notes.trim() : undefined,
          photos: placeData.photos !== undefined ? serializePhotos(placeData.photos) : undefined,
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
          photos: placeData.photos !== undefined ? placeData.photos : p.photos,
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
      await ensureTablesExist(db);
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
      await ensureTablesExist(db);
      await db
        .insert(districtStatuses)
        .values({
          districtId,
          generalNotes: notes,
          photos: serializePhotos(districtData.photos),
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

export async function updateDistrictPhotos(
  districtId: string,
  photos: string[]
): Promise<TrackerState> {
  const db = getDb();
  const state = await getTrackerState();
  const districtData = state.districts[districtId] || { isVisited: false, visitedPlaces: [] };

  if (db) {
    try {
      await ensureTablesExist(db);
      await db
        .insert(districtStatuses)
        .values({
          districtId,
          photos: serializePhotos(photos),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: districtStatuses.districtId,
          set: {
            photos: serializePhotos(photos),
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error('Postgres updateDistrictPhotos error:', err);
    }
  }

  districtData.photos = photos;
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
      await ensureTablesExist(db);
      await db.delete(places);
      await db.delete(districtStatuses);
      // Re-seed defaults
      for (const d of bangkokDistricts) {
        const existing = defaultState.districts[d.id] || { isVisited: false, visitedPlaces: [] };
        await db.insert(districtStatuses).values({
          districtId: d.id,
          isVisited: Boolean(existing.isVisited),
          generalNotes: existing.generalNotes || null,
          photos: serializePhotos(existing.photos),
        });

        for (const p of existing.visitedPlaces || []) {
          await db.insert(places).values({
            id: p.id,
            districtId: d.id,
            name: p.name,
            category: p.category,
            visitedDate: p.visitedDate,
            notes: p.notes,
            photos: serializePhotos(p.photos),
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

  const db = getDb();
  if (db && state.districts) {
    try {
      await ensureTablesExist(db);
      for (const districtId of Object.keys(state.districts)) {
        const d = state.districts[districtId];
        await db
          .insert(districtStatuses)
          .values({
            districtId,
            isVisited: Boolean(d.isVisited),
            generalNotes: d.generalNotes || null,
            photos: serializePhotos(d.photos),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: districtStatuses.districtId,
            set: {
              isVisited: Boolean(d.isVisited),
              generalNotes: d.generalNotes || null,
              photos: serializePhotos(d.photos),
              updatedAt: new Date(),
            },
          });

        if (d.visitedPlaces && d.visitedPlaces.length > 0) {
          for (const p of d.visitedPlaces) {
            await db
              .insert(places)
              .values({
                id: p.id,
                districtId,
                name: p.name,
                category: p.category || 'Other',
                visitedDate: p.visitedDate || null,
                notes: p.notes || null,
                photos: serializePhotos(p.photos),
              })
              .onConflictDoUpdate({
                target: places.id,
                set: {
                  name: p.name,
                  category: p.category || 'Other',
                  visitedDate: p.visitedDate || null,
                  notes: p.notes || null,
                  photos: serializePhotos(p.photos),
                },
              });
          }
        }
      }
    } catch (err) {
      console.error('Postgres saveTrackerState error:', err);
    }
  }

  return true;
}

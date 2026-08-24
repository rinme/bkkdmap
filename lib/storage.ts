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


import fs from 'fs';
import path from 'path';
import initialStateJson from '../data/initial-state.json';
import { Place, DistrictUserData, TrackerState } from './types';

const REDIS_KEY = 'bkk_tracker_state_v1';
const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'bangkok-tracker-state.json');

// In-memory fallback singleton
let memoryStateCache: TrackerState | null = null;

function getInitialDefaultState(): TrackerState {
  return JSON.parse(JSON.stringify(initialStateJson)) as TrackerState;
}

// 1. Upstash Redis / Vercel KV REST adapter
async function getFromRedis(): Promise<TrackerState | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const res = await fetch(`${url}/get/${REDIS_KEY}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.result) {
      if (typeof json.result === 'string') {
        return JSON.parse(json.result) as TrackerState;
      }
      return json.result as TrackerState;
    }
    return null;
  } catch (err) {
    console.error('Redis fetch error:', err);
    return null;
  }
}

async function saveToRedis(state: TrackerState): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return false;
  }

  try {
    const res = await fetch(`${url}/set/${REDIS_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(state))
    });

    return res.ok;
  } catch (err) {
    console.error('Redis save error:', err);
    return false;
  }
}

// 2. Supabase Storage Adapter (Optional)
async function getFromSupabase(): Promise<TrackerState | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/app_state?id=eq.${REDIS_KEY}&select=state_data`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0 && data[0].state_data) {
      return data[0].state_data as TrackerState;
    }
  } catch (err) {
    console.error('Supabase fetch error:', err);
  }
  return null;
}

// 3. Local File System Adapter
function getFromFile(): TrackerState | null {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      return JSON.parse(raw) as TrackerState;
    }
  } catch (err) {
    console.warn('File read warning (normal in serverless):', err);
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
    console.warn('File write warning (normal in serverless read-only FS):', err);
    return false;
  }
}

// Core Unified Methods
export async function getTrackerState(): Promise<TrackerState> {
  // 1. Try Redis/KV
  const redisData = await getFromRedis();
  if (redisData && redisData.districts) {
    memoryStateCache = redisData;
    return redisData;
  }

  // 2. Try Supabase
  const supabaseData = await getFromSupabase();
  if (supabaseData && supabaseData.districts) {
    memoryStateCache = supabaseData;
    return supabaseData;
  }

  // 3. Try In-Memory Cache
  if (memoryStateCache) {
    return memoryStateCache;
  }

  // 4. Try Local File
  const fileData = getFromFile();
  if (fileData && fileData.districts) {
    memoryStateCache = fileData;
    return fileData;
  }

  // 5. Default initial state
  const fallback = getInitialDefaultState();
  memoryStateCache = fallback;
  saveToFile(fallback);
  return fallback;
}

export async function saveTrackerState(state: TrackerState): Promise<boolean> {
  state.lastUpdated = new Date().toISOString();
  memoryStateCache = state;

  // Save to Redis if configured
  const redisSaved = await saveToRedis(state);

  // Always attempt local file save as well
  const fileSaved = saveToFile(state);

  return redisSaved || fileSaved || true;
}

export async function resetTrackerState(): Promise<TrackerState> {
  const defaultState = getInitialDefaultState();
  await saveTrackerState(defaultState);
  return defaultState;
}

export async function toggleDistrictVisited(districtId: string, visited?: boolean): Promise<TrackerState> {
  const state = await getTrackerState();
  const districtData = state.districts[districtId] || {
    isVisited: false,
    visitedPlaces: []
  };

  const newVisited = visited !== undefined ? visited : !districtData.isVisited;
  districtData.isVisited = newVisited;

  state.districts[districtId] = districtData;
  await saveTrackerState(state);
  return state;
}

export async function addPlaceToDistrict(
  districtId: string,
  placeInput: Omit<Place, 'id'>
): Promise<{ state: TrackerState; place: Place }> {
  const state = await getTrackerState();
  const districtData = state.districts[districtId] || {
    isVisited: false,
    visitedPlaces: []
  };

  const newPlace: Place = {
    id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: placeInput.name.trim(),
    category: placeInput.category || 'Other',
    visitedDate: placeInput.visitedDate || new Date().toISOString().split('T')[0],
    notes: placeInput.notes?.trim() || ''
  };

  districtData.visitedPlaces = [newPlace, ...(districtData.visitedPlaces || [])];
  // Auto-mark as visited
  districtData.isVisited = true;

  state.districts[districtId] = districtData;
  await saveTrackerState(state);

  return { state, place: newPlace };
}

export async function updatePlaceInDistrict(
  districtId: string,
  placeId: string,
  placeData: Partial<Place>
): Promise<TrackerState> {
  const state = await getTrackerState();
  const districtData = state.districts[districtId];
  if (!districtData || !districtData.visitedPlaces) {
    return state;
  }

  districtData.visitedPlaces = districtData.visitedPlaces.map((p) => {
    if (p.id === placeId) {
      return {
        ...p,
        ...placeData,
        name: placeData.name !== undefined ? placeData.name.trim() : p.name,
        notes: placeData.notes !== undefined ? placeData.notes.trim() : p.notes
      };
    }
    return p;
  });

  state.districts[districtId] = districtData;
  await saveTrackerState(state);
  return state;
}

export async function deletePlaceFromDistrict(
  districtId: string,
  placeId: string
): Promise<TrackerState> {
  const state = await getTrackerState();
  const districtData = state.districts[districtId];
  if (!districtData || !districtData.visitedPlaces) {
    return state;
  }

  districtData.visitedPlaces = districtData.visitedPlaces.filter((p) => p.id !== placeId);
  // If no places left, update isVisited according to remaining places
  if (districtData.visitedPlaces.length === 0) {
    // Keep isVisited true if user manually set it, or toggle off
    districtData.isVisited = false;
  }

  state.districts[districtId] = districtData;
  await saveTrackerState(state);
  return state;
}

export async function updateDistrictNotes(
  districtId: string,
  notes: string
): Promise<TrackerState> {
  const state = await getTrackerState();
  const districtData = state.districts[districtId] || {
    isVisited: false,
    visitedPlaces: []
  };

  districtData.generalNotes = notes;
  state.districts[districtId] = districtData;
  await saveTrackerState(state);
  return state;
}

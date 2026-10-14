/**
 * Local persistence for catches.
 *
 * ASSUMPTION FLAGGED: spec Section 8 said "AsyncStorage or SQLite, your
 * call." Went with AsyncStorage — the full catch log is at most ~9 photo
 * references plus metadata (one per species; could extend to multiple
 * catches per species), well within AsyncStorage's fit, and it avoids
 * pulling in expo-sqlite + schema/migration work for an MVP with no
 * relational queries. Revisit if catch history grows unbounded (e.g. if
 * every sighting is logged, not just first-per-species) or cross-device
 * sync is added later — SQLite would scale better there.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Catch } from "../data/types";
import { LEGACY_PARK_ID } from "../data/parks";

const STORAGE_KEY = "rangervault:catches";

async function readAll(): Promise<Catch[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Catches saved before multi-park support have no park_id — they were
    // all made in Big Bend, the only park at the time.
    return (parsed as Catch[]).map((c) => (c.park_id ? c : { ...c, park_id: LEGACY_PARK_ID }));
  } catch {
    // Corrupted storage shouldn't crash the app — treat as empty.
    return [];
  }
}

async function writeAll(catches: Catch[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(catches));
}

export async function getAllCatches(): Promise<Catch[]> {
  return readAll();
}

export async function getCatchesBySpecies(parkId: string, speciesId: string): Promise<Catch[]> {
  const all = await readAll();
  return all
    .filter((c) => c.park_id === parkId && c.species_id === speciesId)
    .sort((a, b) => b.caught_at.localeCompare(a.caught_at));
}

export function newCatchId(speciesId: string): string {
  return `${speciesId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Saves a catch. `input.photo_uri` must already be persistent (see
 * store/photos.ts) — pass the id you persisted it under so the two match.
 */
export async function addCatch(input: Catch): Promise<Catch> {
  const all = await readAll();
  const newCatch: Catch = input;
  all.push(newCatch);
  await writeAll(all);
  return newCatch;
}

/** Dev/debug helper — not exposed in the MVP UI. */
export async function clearAllCatches(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

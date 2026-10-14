/**
 * DEV-ONLY (remove before launch): lets the species detail page's preview
 * toggle mark a species as "discovered" on the vault page — grid card +
 * found count — without an actual catch. Deliberately separate from
 * store/catches.ts: this never creates a Catch record, so it can't be
 * mistaken for a real sighting or show up in a species' photo gallery.
 *
 * Persisted (not just in-memory) so toggling it on the detail page and
 * then navigating back to the vault actually shows the effect, which is
 * the entire point of the tool.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "rangervault:dev_preview_discovered";

async function readAll(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    return new Set();
  }
}

async function writeAll(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

/** Species ids flagged as discovered in the given park. Stored keys are `${parkId}:${speciesId}`. */
export async function getDevPreviewDiscoveredIds(parkId: string): Promise<Set<string>> {
  const prefix = `${parkId}:`;
  return new Set(
    [...(await readAll())].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length))
  );
}

export async function setDevPreviewDiscovered(
  parkId: string,
  speciesId: string,
  discovered: boolean
): Promise<void> {
  const ids = await readAll();
  const key = `${parkId}:${speciesId}`;
  if (discovered) {
    ids.add(key);
  } else {
    ids.delete(key);
  }
  await writeAll(ids);
}

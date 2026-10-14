/**
 * Tiny AsyncStorage-backed list, the same read/write-whole-array pattern as
 * store/catches.ts, factored out for the smaller stores that came later.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export function jsonList<T>(storageKey: string) {
  async function read(): Promise<T[]> {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      // Corrupted storage shouldn't crash the app — treat as empty.
      return [];
    }
  }
  async function write(items: T[]): Promise<void> {
    await AsyncStorage.setItem(storageKey, JSON.stringify(items));
  }
  return { read, write };
}

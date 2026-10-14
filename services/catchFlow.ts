/**
 * Turns a photo + identification result into a CatchResult, saving the
 * catch when it's a confident live match. Shared by the camera screen
 * (live) and services/syncQueue.ts (offline photos identified later).
 *
 * CatchResult is deliberately plain JSON (ids, not Species objects) so the
 * offline flow can store it as a field note and show it later.
 */

import { getParkEntry } from "../data/parks";
import type { Park } from "../data/types";
import { addCatch, getAllCatches, newCatchId } from "../store/catches";
import { enqueuePending } from "../store/pendingIdentifications";
import { persistPhoto } from "../store/photos";
import { CONFIDENCE_THRESHOLD, identify, IdentifyError, OfflineError, type IdentifyResponse } from "./identify";
import { computeProgress, diffProgress, type StampLevel } from "./progress";

export type CatchResult =
  | {
      kind: "match";
      park_id: string;
      species_id: string;
      confidence: number;
      photoUri: string;
      xpGained: number;
      newBadgeIds: string[];
      rankUpName?: string;
      newStamp?: { park_id: string; level: Exclude<StampLevel, "none"> };
    }
  | { kind: "no_confident_match"; park_id: string; species_id: string; confidence: number; photoUri: string }
  | { kind: "not_in_park"; park_id: string; bestGuessName?: string; photoUri: string }
  | { kind: "no_animal"; photoUri: string }
  | { kind: "not_live"; subject: "screen_or_print" | "toy_or_model"; photoUri: string }
  | { kind: "queued"; photoUri: string }
  | { kind: "error"; message: string };

export interface Capture {
  /** Cache or persisted URI; persisted on demand. */
  photoUri: string;
  park: Park;
  /** ISO timestamp of when the photo was taken. */
  takenAt: string;
  lat?: number;
  lon?: number;
}

/** Live flow: identify now, or queue the photo if there's no signal. */
export async function identifyCapture(capture: Capture): Promise<CatchResult> {
  try {
    const response = await identifyForPark(capture);
    return await resolveResponse(capture, response);
  } catch (err) {
    if (err instanceof OfflineError) {
      const id = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const photoUri = await persistPhoto(capture.photoUri, id);
      await enqueuePending({
        id,
        photo_uri: photoUri,
        park_id: capture.park.id,
        taken_at: capture.takenAt,
        lat: capture.lat,
        lon: capture.lon,
        attempts: 0,
      });
      return { kind: "queued", photoUri };
    }
    return {
      kind: "error",
      message: err instanceof IdentifyError ? err.message : "Something went wrong identifying this photo.",
    };
  }
}

export function identifyForPark(capture: Capture): Promise<IdentifyResponse> {
  return identify({
    photoUri: capture.photoUri,
    park: { id: capture.park.id, name: capture.park.name },
    candidates: capture.park.entries.flatMap((e) => {
      const entry = getParkEntry(capture.park, e.species_id);
      return entry
        ? [{ id: entry.species_id, common_name: entry.species.common_name, scientific_name: entry.species.scientific_name }]
        : [];
    }),
  });
}

/** Maps an identification to a result; saves the catch (with a persisted photo) on a confident live match. */
export async function resolveResponse(capture: Capture, response: IdentifyResponse): Promise<CatchResult> {
  const { photoUri, park } = capture;

  if (response.subject === "screen_or_print" || response.subject === "toy_or_model") {
    return { kind: "not_live", subject: response.subject, photoUri };
  }
  if (response.subject === "no_animal") {
    return { kind: "no_animal", photoUri };
  }
  const entry = response.species_id ? getParkEntry(park, response.species_id) : undefined;
  if (!entry) {
    return { kind: "not_in_park", park_id: park.id, bestGuessName: response.best_guess_name, photoUri };
  }
  if (response.confidence < CONFIDENCE_THRESHOLD) {
    return {
      kind: "no_confident_match",
      park_id: park.id,
      species_id: entry.species_id,
      confidence: response.confidence,
      photoUri,
    };
  }

  const before = computeProgress(await getAllCatches());
  const id = newCatchId(entry.species_id);
  const persistedUri = await persistPhoto(photoUri, id);
  await addCatch({
    id,
    species_id: entry.species_id,
    park_id: park.id,
    photo_uri: persistedUri,
    caught_at: capture.takenAt,
    confidence_score: response.confidence,
    lat: capture.lat,
    lon: capture.lon,
  });
  const delta = diffProgress(before, computeProgress(await getAllCatches()));

  return {
    kind: "match",
    park_id: park.id,
    species_id: entry.species_id,
    confidence: response.confidence,
    photoUri: persistedUri,
    xpGained: delta.xpGained,
    newBadgeIds: delta.newBadges.map((b) => b.id),
    rankUpName: delta.rankUp?.name,
    newStamp: delta.newStamp ? { park_id: delta.newStamp.park.id, level: delta.newStamp.level } : undefined,
  };
}

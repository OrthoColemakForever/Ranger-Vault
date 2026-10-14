/**
 * The contract every identification engine implements. Screens only ever
 * talk to `identify()` in ./index.ts, so swapping the cloud engine for an
 * on-device one later touches nothing outside this folder.
 */

export interface SpeciesCandidate {
  id: string;
  common_name: string;
  scientific_name: string;
}

export interface IdentifyRequest {
  /** Local file URI of the photo. */
  photoUri: string;
  park: { id: string; name: string };
  /** The park's species list — engines only ever answer with one of these ids. */
  candidates: SpeciesCandidate[];
}

/** What the photo shows. Anything but "live_animal" never counts as a catch. */
export type PhotoSubject = "live_animal" | "screen_or_print" | "toy_or_model" | "no_animal";

export interface IdentifyResponse {
  /** Best-matching candidate id, or null if it's none of them. Engines map their own labels to our ids internally. */
  species_id: string | null;
  confidence: number;
  top_k: { species_id: string; confidence: number }[];
  subject: PhotoSubject;
  /** Free-text name of whatever animal is there, even if it isn't a candidate (e.g. "Domestic dog"). */
  best_guess_name?: string;
  engine: "cloud" | "on_device";
}

export interface Identifier {
  /** Whether this engine can run right now (model downloaded, endpoint configured, ...). */
  isAvailable(): boolean;
  identify(request: IdentifyRequest): Promise<IdentifyResponse>;
}

export class IdentifyError extends Error {}

/** The request never reached the identification service (no signal) — the photo should be queued, not discarded. */
export class OfflineError extends IdentifyError {}

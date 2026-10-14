import type { ImageSourcePropType } from "react-native";

// Shared data model. Originally per RangerVault_SPEC.md Section 6; reshaped
// for multi-park support: Species is now a park-agnostic catalog entry, and
// everything park-specific (rarity, facts, where-to-look) lives on a
// ParkEntry so the same animal can appear in several parks with different
// text — e.g. black bears in both Big Bend and Yellowstone.

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  /** Taxonomic family, e.g. "Canidae" — drives family-based badges (data/badges.ts). */
  family: string;
  /**
   * Exact `model_class` string from SBUSA-ADS-v1's taxonomy.csv, for a future
   * on-device engine that emits that model's labels (see
   * services/identify/onDevice.ts). Do not "prettify" this string; match it
   * verbatim. Optional: species outside that model's label set don't have one.
   */
  model_label?: string;
  /**
   * Bundled art (via `require()` in data/species.ts, see assets/species/)
   * shown once the species has been caught — vault grid card + species
   * detail hero. Tight-cropped transparent cutout; see DISCOVERED_SPRITE_BG
   * in data/spriteColors.ts for the container color it needs.
   *
   * Optional (2026-10-14) so new parks don't block on custom art: without
   * it, the card falls back to the user's own first photo of the species.
   */
  discovered_image?: ImageSourcePropType;
  /**
   * "Not yet caught" state, split into two separately-tintable alpha masks —
   * each is solid white with only the alpha channel carrying shape, meant to
   * be rendered with Image's `tintColor` against SILHOUETTE_SHAPE_COLOR /
   * QUESTION_MARK_COLOR (see data/spriteColors.ts). Optional like
   * discovered_image; without them, components/SpeciesSprite.tsx draws a
   * generic "?" placeholder.
   */
  silhouette_shape_image?: ImageSourcePropType;
  /** The "?" mark layer — see silhouette_shape_image. Same pixel dimensions as its shape counterpart, meant to be stacked directly on top of it. */
  question_mark_image?: ImageSourcePropType;
  /**
   * Per-species visual scale applied to BOTH discovered_image and the
   * silhouette pair equally (so an animal doesn't visibly jump in size
   * when it flips from undiscovered to discovered), on top of the normal
   * resizeMode="contain" fit. Defaults to 1 (no change) when omitted.
   *
   * Why this exists: every sprite is tight-cropped to its own content with
   * no shared margin, so aspect ratios vary wildly across species — from
   * ~0.83 (jackrabbit, tall) to 2.39 (mountain lion, wide). "contain"
   * always fits the longer axis to the box, so a wide/lean animal ends up
   * with much more empty margin than a compact one at the exact same
   * scale value, and looks smaller as a result. Bump this up for species
   * that look too small, e.g. try 1.4–1.6 for mountain_lion; down for ones
   * that look too large, e.g. 0.7 for black_tailed_jackrabbit. Pure trial
   * and error by eye.
   */
  sprite_scale?: number;
}

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

/** A species as it appears in one particular park. */
export interface ParkEntry {
  species_id: string;
  rarity: Rarity;
  fact_blurb: string;
  /** Short "where to look" hint — shown on the species detail page between the fact blurb and the sightings gallery. */
  location_hint: string;
}

export interface Park {
  id: string;
  name: string;
  state: string;
  /**
   * Rough park footprint as a circle, used only to guess which park the user
   * is standing in. Deliberately crude — swap for NPS boundary polygons if
   * neighbouring parks ever get close enough to overlap.
   */
  center: { lat: number; lon: number };
  radius_km: number;
  /** Accent for the park's header/cards. */
  accent_color: string;
  entries: ParkEntry[];
}

export interface Catch {
  id: string;
  species_id: string;
  /**
   * Park the catch counts toward. Catches saved before multi-park support
   * have no park_id on disk; store/catches.ts fills in "big_bend" on read.
   */
  park_id: string;
  /** Persistent local file URI (see store/photos.ts) — never a cache URI. */
  photo_uri: string;
  /** ISO 8601 timestamp of when the photo was taken (not when it was identified, which can be later for offline photos). */
  caught_at: string;
  /** Model's confidence score at time of catch, for debugging/tuning threshold. */
  confidence_score: number;
  lat?: number;
  lon?: number;
}

/**
 * Gamification, derived entirely from the catch log.
 *
 * Nothing here is persisted: XP, rank, stamps, and badges are recomputed
 * from store/catches.ts every time, so they can never drift out of sync
 * with the actual catches and changing a rule (e.g. XP values) applies
 * retroactively with no migration.
 */

import { BADGES, type Badge, type BadgeContext } from "../data/badges";
import { getParkById, getParkEntry, PARKS } from "../data/parks";
import { getSpeciesById } from "../data/species";
import type { Catch, Park, Rarity } from "../data/types";

export const XP_FIRST_CATCH: Record<Rarity, number> = {
  common: 50,
  uncommon: 100,
  rare: 250,
  legendary: 500,
};
/** Repeat sighting of an already-caught species; awarded at most once per species per park per day, so photo-spamming one elk earns nothing. */
export const XP_REPEAT_SIGHTING = 10;
/** Bonus for the first catch in a park. */
export const XP_NEW_PARK = 200;

export interface Rank {
  name: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { name: "Junior Ranger", minXp: 0 },
  { name: "Ranger", minXp: 500 },
  { name: "Senior Ranger", minXp: 1500 },
  { name: "Chief Ranger", minXp: 4000 },
  { name: "Legend of the Parks", minXp: 10000 },
];

export type StampLevel = "none" | "stamped" | "gold";

export interface ParkProgress {
  park: Park;
  caughtSpeciesIds: Set<string>;
  caughtCount: number;
  total: number;
  /** "stamped" on the first catch in the park, "gold" at 100% completion. */
  stamp: StampLevel;
}

export interface Trip {
  park_id: string;
  start: string;
  end: string;
  catches: Catch[];
  /** Species caught for the first time ever (in that park) during this trip. */
  newSpeciesIds: string[];
}

export interface Progress {
  xp: number;
  rank: Rank;
  nextRank?: Rank;
  /** XP each catch earned, by catch id. */
  xpByCatch: Map<string, number>;
  parks: ParkProgress[];
  earnedBadgeIds: Set<string>;
  trips: Trip[];
}

const byTime = (a: Catch, b: Catch) => a.caught_at.localeCompare(b.caught_at);

function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function rarityOf(c: Catch): Rarity | undefined {
  const park = getParkById(c.park_id);
  return park ? getParkEntry(park, c.species_id)?.rarity : undefined;
}

/** Catches more than this far apart in the same park start a new trip. */
const TRIP_GAP_MS = 3 * 24 * 60 * 60 * 1000;

export function computeProgress(allCatches: Catch[]): Progress {
  const catches = [...allCatches].sort(byTime);

  let xp = 0;
  const xpByCatch = new Map<string, number>();
  const seenSpecies = new Set<string>(); // `${park}:${species}`
  const seenParks = new Set<string>();
  const repeatAwarded = new Set<string>(); // `${park}:${species}:${day}`

  for (const c of catches) {
    const key = `${c.park_id}:${c.species_id}`;
    let earned = 0;
    if (!seenParks.has(c.park_id)) {
      seenParks.add(c.park_id);
      earned += XP_NEW_PARK;
    }
    if (!seenSpecies.has(key)) {
      seenSpecies.add(key);
      const rarity = rarityOf(c);
      earned += rarity ? XP_FIRST_CATCH[rarity] : 0;
      // The first catch also uses up that day's repeat award.
      repeatAwarded.add(`${key}:${localDay(c.caught_at)}`);
    } else {
      const dayKey = `${key}:${localDay(c.caught_at)}`;
      if (!repeatAwarded.has(dayKey)) {
        repeatAwarded.add(dayKey);
        earned += XP_REPEAT_SIGHTING;
      }
    }
    xpByCatch.set(c.id, earned);
    xp += earned;
  }

  const parks: ParkProgress[] = PARKS.map((park) => {
    const listed = new Set(park.entries.map((e) => e.species_id));
    const caughtSpeciesIds = new Set(
      catches.filter((c) => c.park_id === park.id && listed.has(c.species_id)).map((c) => c.species_id)
    );
    const caughtCount = caughtSpeciesIds.size;
    const total = listed.size;
    const stamp: StampLevel =
      caughtCount === 0 ? "none" : caughtCount === total ? "gold" : "stamped";
    return { park, caughtSpeciesIds, caughtCount, total, stamp };
  });

  const badgeContext: BadgeContext = {
    catches,
    rarityOf,
    familyOf: (c) => getSpeciesById(c.species_id)?.family,
    parksVisited: parks.filter((p) => p.stamp !== "none").length,
    parksCompleted: parks.filter((p) => p.stamp === "gold").length,
  };
  const earnedBadgeIds = new Set(BADGES.filter((b) => b.earned(badgeContext)).map((b) => b.id));

  const rankIndex = RANKS.reduce((best, r, i) => (xp >= r.minXp ? i : best), 0);

  return {
    xp,
    rank: RANKS[rankIndex],
    nextRank: RANKS[rankIndex + 1],
    xpByCatch,
    parks,
    earnedBadgeIds,
    trips: groupTrips(catches),
  };
}

function groupTrips(sortedCatches: Catch[]): Trip[] {
  const trips: Trip[] = [];
  const lastTripByPark = new Map<string, Trip>();
  const seen = new Set<string>();
  for (const c of sortedCatches) {
    let trip = lastTripByPark.get(c.park_id);
    if (!trip || Date.parse(c.caught_at) - Date.parse(trip.end) > TRIP_GAP_MS) {
      trip = { park_id: c.park_id, start: c.caught_at, end: c.caught_at, catches: [], newSpeciesIds: [] };
      trips.push(trip);
      lastTripByPark.set(c.park_id, trip);
    }
    trip.catches.push(c);
    trip.end = c.caught_at;
    const key = `${c.park_id}:${c.species_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      trip.newSpeciesIds.push(c.species_id);
    }
  }
  // Most recent trip first.
  return trips.reverse();
}

export interface ProgressDelta {
  xpGained: number;
  newBadges: Badge[];
  /** Set only when the rank changed. */
  rankUp?: Rank;
  newStamp?: { park: Park; level: Exclude<StampLevel, "none"> };
}

/** What changed between two progress snapshots — powers the catch result celebration. */
export function diffProgress(before: Progress, after: Progress): ProgressDelta {
  const newBadges = BADGES.filter((b) => after.earnedBadgeIds.has(b.id) && !before.earnedBadgeIds.has(b.id));
  const stampChange = after.parks.find((p, i) => p.stamp !== before.parks[i]?.stamp);
  return {
    xpGained: after.xp - before.xp,
    newBadges,
    rankUp: after.rank.name !== before.rank.name ? after.rank : undefined,
    newStamp:
      stampChange && stampChange.stamp !== "none"
        ? { park: stampChange.park, level: stampChange.stamp }
        : undefined,
  };
}

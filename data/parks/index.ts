import type { Park, ParkEntry, Species } from "../types";
import { getSpeciesById } from "../species";
import { BIG_BEND } from "./big_bend";
import { YELLOWSTONE } from "./yellowstone";

export const PARKS: Park[] = [BIG_BEND, YELLOWSTONE];

/** Park assumed for catches saved before multi-park support. */
export const LEGACY_PARK_ID = BIG_BEND.id;

export function getParkById(id: string): Park | undefined {
  return PARKS.find((p) => p.id === id);
}

/** A park entry joined with its catalog species — what screens actually render. */
export interface ParkSpecies extends ParkEntry {
  species: Species;
}

export function getParkSpecies(park: Park): ParkSpecies[] {
  return park.entries.flatMap((entry) => {
    const species = getSpeciesById(entry.species_id);
    return species ? [{ ...entry, species }] : [];
  });
}

export function getParkEntry(park: Park, speciesId: string): ParkSpecies | undefined {
  return getParkSpecies(park).find((e) => e.species_id === speciesId);
}

/** Great-circle distance in km. */
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** The park whose (rough, circular) footprint contains this point, if any. */
export function findParkAt(point: { lat: number; lon: number }): Park | undefined {
  return PARKS.find((p) => distanceKm(point, p.center) <= p.radius_km);
}

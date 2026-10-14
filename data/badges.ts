import type { Catch, Rarity } from "./types";

/** Everything a badge rule may look at. Built by services/progress.ts. */
export interface BadgeContext {
  /** All catches, oldest first. */
  catches: Catch[];
  /** Rarity of the species a catch is for, in the park it was caught. */
  rarityOf: (c: Catch) => Rarity | undefined;
  familyOf: (c: Catch) => string | undefined;
  /** Parks with at least one catch. */
  parksVisited: number;
  /** Parks where every listed species has been caught. */
  parksCompleted: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Short emoji glyph until badge art exists. */
  icon: string;
  earned: (ctx: BadgeContext) => boolean;
}

const localHour = (iso: string) => new Date(iso).getHours();

export const BADGES: Badge[] = [
  {
    id: "first_catch",
    name: "First Catch",
    description: "Catch your first animal.",
    icon: "📸",
    earned: (ctx) => ctx.catches.length > 0,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Catch an animal between 8pm and 5am.",
    icon: "🦉",
    earned: (ctx) => ctx.catches.some((c) => localHour(c.caught_at) >= 20 || localHour(c.caught_at) < 5),
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Catch an animal between 5am and 7am, when wildlife is most active.",
    icon: "🌅",
    earned: (ctx) => ctx.catches.some((c) => localHour(c.caught_at) >= 5 && localHour(c.caught_at) < 7),
  },
  {
    id: "canid_collector",
    name: "Canid Collector",
    description: "Catch three different members of the dog family.",
    icon: "🐺",
    earned: (ctx) =>
      new Set(ctx.catches.filter((c) => ctx.familyOf(c) === "Canidae").map((c) => c.species_id)).size >= 3,
  },
  {
    id: "rare_find",
    name: "Rare Find",
    description: "Catch a rare species.",
    icon: "💎",
    earned: (ctx) => ctx.catches.some((c) => ctx.rarityOf(c) === "rare"),
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Catch a legendary species.",
    icon: "👑",
    earned: (ctx) => ctx.catches.some((c) => ctx.rarityOf(c) === "legendary"),
  },
  {
    id: "park_hopper",
    name: "Park Hopper",
    description: "Make catches in two different parks.",
    icon: "🗺️",
    earned: (ctx) => ctx.parksVisited >= 2,
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Catch every species in a park.",
    icon: "🏆",
    earned: (ctx) => ctx.parksCompleted >= 1,
  },
];

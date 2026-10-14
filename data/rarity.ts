import type { Rarity } from "./types";

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

/** Card border / badge color per tier — earthy to match the park palette. */
export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#8f8a7c",
  uncommon: "#5b6b3f",
  rare: "#3f6b8a",
  legendary: "#b8862b",
};

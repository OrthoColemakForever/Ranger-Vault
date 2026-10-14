import type { Species } from "./types";

/**
 * Global species catalog — one entry per animal, shared by every park that
 * lists it (see data/parks/). Park-specific text (facts, where to look,
 * rarity) lives on each park's ParkEntry, not here.
 *
 * `model_label` values for the original nine Big Bend species are pulled
 * verbatim from `taxonomy.csv`'s `model_class` column in
 * Addax-Data-Science/SBUSA-ADS-v1 on HuggingFace — confirmed present in the
 * model's actual label set, not hand-typed from memory. Note the model
 * outputs lowercase Latin binomials (e.g. "puma concolor"). Species added
 * for other parks leave it unset until an on-device model covers them.
 *
 * Original nine confirmed with Tre' 2026-08-04.
 */
export const SPECIES: Species[] = [
  // --- Big Bend originals (bundled sprite art) ---
  {
    id: "black_bear",
    common_name: "Black Bear",
    scientific_name: "Ursus americanus",
    family: "Ursidae",
    model_label: "ursus americanus",
    discovered_image: require("../assets/species/black_bear_discovered.png"),
    silhouette_shape_image: require("../assets/species/black_bear_silhouette_shape.png"),
    question_mark_image: require("../assets/species/black_bear_question_mark.png"),
  },
  {
    id: "mountain_lion",
    common_name: "Mountain Lion",
    scientific_name: "Puma concolor",
    family: "Felidae",
    model_label: "puma concolor",
    discovered_image: require("../assets/species/mountain_lion_discovered.png"),
    silhouette_shape_image: require("../assets/species/mountain_lion_silhouette_shape.png"),
    question_mark_image: require("../assets/species/mountain_lion_question_mark.png"),
  },
  {
    id: "javelina",
    common_name: "Javelina",
    scientific_name: "Dicotyles tajacu",
    family: "Tayassuidae",
    model_label: "dicotyles tajacu",
    discovered_image: require("../assets/species/javelina_discovered.png"),
    silhouette_shape_image: require("../assets/species/javelina_silhouette_shape.png"),
    question_mark_image: require("../assets/species/javelina_question_mark.png"),
  },
  {
    id: "mule_deer",
    common_name: "Mule Deer",
    scientific_name: "Odocoileus hemionus",
    family: "Cervidae",
    model_label: "odocoileus hemionus",
    discovered_image: require("../assets/species/mule_deer_discovered.png"),
    silhouette_shape_image: require("../assets/species/mule_deer_silhouette_shape.png"),
    question_mark_image: require("../assets/species/mule_deer_question_mark.png"),
  },
  {
    id: "white_tailed_deer",
    common_name: "White-tailed Deer",
    scientific_name: "Odocoileus virginianus",
    family: "Cervidae",
    model_label: "odocoileus virginianus",
    discovered_image: require("../assets/species/white_tailed_deer_discovered.png"),
    silhouette_shape_image: require("../assets/species/white_tailed_deer_silhouette_shape.png"),
    question_mark_image: require("../assets/species/white_tailed_deer_question_mark.png"),
  },
  {
    id: "coyote",
    common_name: "Coyote",
    scientific_name: "Canis latrans",
    family: "Canidae",
    model_label: "canis latrans",
    discovered_image: require("../assets/species/coyote_discovered.png"),
    silhouette_shape_image: require("../assets/species/coyote_silhouette_shape.png"),
    question_mark_image: require("../assets/species/coyote_question_mark.png"),
  },
  {
    id: "gray_fox",
    common_name: "Gray Fox",
    scientific_name: "Urocyon cinereoargenteus",
    family: "Canidae",
    model_label: "urocyon cinereoargenteus",
    discovered_image: require("../assets/species/gray_fox_discovered.png"),
    silhouette_shape_image: require("../assets/species/gray_fox_silhouette_shape.png"),
    question_mark_image: require("../assets/species/gray_fox_question_mark.png"),
  },
  {
    id: "ringtail",
    common_name: "Ringtail",
    scientific_name: "Bassariscus astutus",
    family: "Procyonidae",
    model_label: "bassariscus astutus",
    discovered_image: require("../assets/species/ringtail_discovered.png"),
    silhouette_shape_image: require("../assets/species/ringtail_silhouette_shape.png"),
    question_mark_image: require("../assets/species/ringtail_question_mark.png"),
  },
  {
    id: "black_tailed_jackrabbit",
    common_name: "Black-tailed Jackrabbit",
    scientific_name: "Lepus californicus",
    family: "Leporidae",
    model_label: "lepus californicus",
    discovered_image: require("../assets/species/black_tailed_jackrabbit_discovered.png"),
    silhouette_shape_image: require("../assets/species/black_tailed_jackrabbit_silhouette_shape.png"),
    question_mark_image: require("../assets/species/black_tailed_jackrabbit_question_mark.png"),
    sprite_scale: 0.7,
  },

  // --- Added for Yellowstone (no custom art yet — SpeciesSprite falls back) ---
  { id: "american_bison", common_name: "American Bison", scientific_name: "Bison bison", family: "Bovidae" },
  { id: "elk", common_name: "Elk", scientific_name: "Cervus canadensis", family: "Cervidae" },
  { id: "grizzly_bear", common_name: "Grizzly Bear", scientific_name: "Ursus arctos horribilis", family: "Ursidae" },
  { id: "gray_wolf", common_name: "Gray Wolf", scientific_name: "Canis lupus", family: "Canidae" },
  { id: "pronghorn", common_name: "Pronghorn", scientific_name: "Antilocapra americana", family: "Antilocapridae" },
  { id: "moose", common_name: "Moose", scientific_name: "Alces alces", family: "Cervidae" },
  { id: "bighorn_sheep", common_name: "Bighorn Sheep", scientific_name: "Ovis canadensis", family: "Bovidae" },
  {
    id: "yellow_bellied_marmot",
    common_name: "Yellow-bellied Marmot",
    scientific_name: "Marmota flaviventris",
    family: "Sciuridae",
  },
];

export function getSpeciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function getSpeciesByModelLabel(modelLabel: string): Species | undefined {
  return SPECIES.find((s) => s.model_label === modelLabel);
}

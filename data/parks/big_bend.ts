import type { Park } from "../types";

/** RangerVault V1's original park. Species list confirmed with Tre' 2026-08-04. */
export const BIG_BEND: Park = {
  id: "big_bend",
  name: "Big Bend",
  state: "Texas",
  center: { lat: 29.25, lon: -103.25 },
  radius_km: 60,
  accent_color: "#a8592f",
  entries: [
    {
      species_id: "black_bear",
      rarity: "rare",
      fact_blurb:
        "Once nearly wiped out of Big Bend, black bears recolonized the Chisos Mountains on their own in the 1980s, wandering up from Mexico's Sierra del Carmen.",
      location_hint:
        "Look high — the Chisos Mountains, especially around the Window Trail and Boot Canyon, where oak and pine cover gives them food and shade.",
    },
    {
      species_id: "mountain_lion",
      rarity: "legendary",
      fact_blurb:
        "Big Bend's apex predator. An estimated 20–25 mountain lions range across the park's canyons and desert scrub, mostly hunting deer and javelina.",
      location_hint:
        "Elusive and rarely seen directly — your best odds are fresh tracks or sign along the rocky canyons and slopes of the Chisos Mountains, near dawn or dusk.",
    },
    {
      species_id: "javelina",
      rarity: "common",
      fact_blurb:
        "Despite the look, javelina aren't pigs — they're peccaries, a separate family entirely. They travel in tight, vocal herds across the desert flats.",
      location_hint:
        "Desert flats and washes near Rio Grande Village and Cottonwood Campground — herds often move through campsites at dawn or dusk.",
    },
    {
      species_id: "mule_deer",
      rarity: "common",
      fact_blurb:
        "Named for their oversized ears, mule deer favor Big Bend's higher and rockier ground, bounding away in a stiff-legged four-point gait called stotting.",
      location_hint:
        "Higher, rockier terrain — the Chisos Basin and the high desert grasslands leading up to it, especially in early morning.",
    },
    {
      species_id: "white_tailed_deer",
      rarity: "common",
      fact_blurb:
        "The Chisos Mountains hold their own distinct, smaller-bodied subspecies — the Carmen Mountains white-tailed deer — found nowhere else in the U.S.",
      location_hint:
        "The Chisos Basin itself — commonly grazing right around the campground, lodge, and the lower Window/Laguna Meadow trails.",
    },
    {
      species_id: "coyote",
      rarity: "common",
      fact_blurb:
        "Big Bend's most frequently heard resident. Their yipping choruses at dusk and dawn carry for miles across the open desert.",
      location_hint:
        "Widespread across the desert lowlands — commonly spotted trotting along the road near Panther Junction and the Chihuahuan Desert flats at dusk.",
    },
    {
      species_id: "gray_fox",
      rarity: "uncommon",
      fact_blurb:
        "One of the only canids that climbs trees. Gray foxes hunt the park's rocky slopes and desert washes mostly after dark.",
      location_hint:
        "Rocky slopes and desert washes throughout the park — mostly nocturnal, with occasional sightings near Santa Elena Canyon after dark.",
    },
    {
      species_id: "ringtail",
      rarity: "rare",
      fact_blurb:
        "A raccoon relative with a fox-like face and a striped tail as long as its body. Nocturnal and rarely seen, but common around the Chisos Basin at night.",
      location_hint:
        "Nocturnal and drawn to campsites — your best shot is after dark around the Chisos Basin campground and lodge.",
    },
    {
      species_id: "black_tailed_jackrabbit",
      rarity: "common",
      fact_blurb:
        "Actually a hare, not a rabbit. Its oversized ears radiate heat, helping it stay active through Big Bend's brutal desert afternoons.",
      location_hint:
        "Open desert flats and grasslands — commonly seen along the roadside near Persimmon Gap and the park's eastern lowlands.",
    },
  ],
};

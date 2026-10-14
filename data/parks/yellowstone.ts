import type { Park } from "../types";

/**
 * Second park, added 2026-10-14 as a starting list — easy to swap. Facts are
 * drawn from NPS Yellowstone material; worth a ranger-level review before
 * launch. Every hint keeps people at a distance on purpose: the park
 * requires staying 100 yards from bears and wolves and 25 yards from
 * everything else.
 */
export const YELLOWSTONE: Park = {
  id: "yellowstone",
  name: "Yellowstone",
  state: "Wyoming · Montana · Idaho",
  center: { lat: 44.6, lon: -110.5 },
  radius_km: 70,
  accent_color: "#3f6b8a",
  entries: [
    {
      species_id: "american_bison",
      rarity: "common",
      fact_blurb:
        "Yellowstone is the only place in the U.S. where bison have lived continuously since prehistoric times. They can sprint about 35 mph — far faster than you.",
      location_hint:
        "Lamar and Hayden Valleys year-round. Stay at least 25 yards away, even when they wander right up to the road.",
    },
    {
      species_id: "elk",
      rarity: "common",
      fact_blurb:
        "The most abundant large mammal in the park. In fall, bulls bugle — a high, eerie whistle — to challenge rivals during the rut.",
      location_hint:
        "Mammoth Hot Springs, where they often graze the lawns in town, and meadows along the Madison River.",
    },
    {
      species_id: "pronghorn",
      rarity: "common",
      fact_blurb:
        "The fastest land animal in the Western Hemisphere. Not a true antelope — its closest living relatives are giraffes and okapis.",
      location_hint:
        "Open sagebrush flats near the North Entrance at Gardiner and in the Lamar Valley.",
    },
    {
      species_id: "yellow_bellied_marmot",
      rarity: "common",
      fact_blurb:
        "Nicknamed the \"whistle pig\" for its sharp alarm call. Marmots can spend up to eight months of the year hibernating.",
      location_hint:
        "Rocky slopes and talus fields in summer — the Mount Washburn trail and Sheepeater Cliff are reliable spots.",
    },
    {
      species_id: "coyote",
      rarity: "common",
      fact_blurb:
        "Coyote numbers in the park's northern range dropped sharply after wolves returned in 1995 — a famous ripple effect of reintroduction.",
      location_hint:
        "Meadows across the park — watch for one pouncing on voles in the grass in Hayden and Lamar Valleys.",
    },
    {
      species_id: "bighorn_sheep",
      rarity: "uncommon",
      fact_blurb:
        "A ram's curled horns can weigh 30 pounds. During the fall rut, rams charge each other head-on at around 20 mph.",
      location_hint:
        "Cliffs along the Gardner River canyon between Gardiner and Mammoth, and the high slopes of Mount Washburn.",
    },
    {
      species_id: "moose",
      rarity: "uncommon",
      fact_blurb:
        "Yellowstone has only a small moose population. They're strong swimmers and can dive to feed on plants at the bottom of ponds.",
      location_hint:
        "Willow-lined streams and marshes, especially around Soda Butte Creek in the park's northeast corner.",
    },
    {
      species_id: "black_bear",
      rarity: "uncommon",
      fact_blurb:
        "Despite the name, Yellowstone's black bears can be brown, cinnamon, or even blond. Color won't tell you black from grizzly — look for the grizzly's shoulder hump.",
      location_hint:
        "Forest edges around Tower-Roosevelt and the northern range. Stay at least 100 yards away.",
    },
    {
      species_id: "grizzly_bear",
      rarity: "rare",
      fact_blurb:
        "Listed as threatened in 1975 when only a few hundred remained in the region, grizzlies have since rebounded to roughly a thousand across Greater Yellowstone.",
      location_hint:
        "Hayden Valley and Dunraven Pass in spring and early summer. Use a long lens and stay at least 100 yards away.",
    },
    {
      species_id: "gray_wolf",
      rarity: "legendary",
      fact_blurb:
        "Wolves were wiped out of Yellowstone by the 1920s and reintroduced in 1995–96 — one of the best-studied wildlife comebacks in the world.",
      location_hint:
        "Lamar Valley at dawn or dusk. Look for the line of spotting scopes at the pullouts — wolf watchers are happy to share. Stay 100 yards away.",
    },
  ],
};

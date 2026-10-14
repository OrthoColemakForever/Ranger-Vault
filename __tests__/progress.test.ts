/// <reference types="jest" />
import { computeProgress, diffProgress, RANKS, XP_FIRST_CATCH, XP_NEW_PARK, XP_REPEAT_SIGHTING } from "../services/progress";
import { BIG_BEND } from "../data/parks/big_bend";
import type { Catch } from "../data/types";

let n = 0;
function c(species_id: string, caught_at: string, park_id = "big_bend"): Catch {
  return { id: `c${n++}`, species_id, park_id, caught_at, photo_uri: "file:///x.jpg", confidence_score: 0.9 };
}

describe("computeProgress", () => {
  it("is empty with no catches", () => {
    const p = computeProgress([]);
    expect(p.xp).toBe(0);
    expect(p.rank.name).toBe(RANKS[0].name);
    expect(p.earnedBadgeIds.size).toBe(0);
    expect(p.parks.every((park) => park.stamp === "none")).toBe(true);
  });

  it("awards rarity XP plus the new-park bonus on the first catch", () => {
    const p = computeProgress([c("javelina", "2026-03-01T15:00:00")]);
    expect(p.xp).toBe(XP_NEW_PARK + XP_FIRST_CATCH.common);
    const legendary = computeProgress([c("mountain_lion", "2026-03-01T15:00:00")]);
    expect(legendary.xp).toBe(XP_NEW_PARK + XP_FIRST_CATCH.legendary);
  });

  it("caps repeat sightings at one award per species per day", () => {
    const p = computeProgress([
      c("javelina", "2026-03-01T09:00:00"),
      c("javelina", "2026-03-01T10:00:00"), // same day as first catch: nothing
      c("javelina", "2026-03-02T09:00:00"), // new day: repeat XP
      c("javelina", "2026-03-02T11:00:00"), // same day again: nothing
    ]);
    expect(p.xp).toBe(XP_NEW_PARK + XP_FIRST_CATCH.common + XP_REPEAT_SIGHTING);
  });

  it("counts the same species separately per park", () => {
    const p = computeProgress([
      c("black_bear", "2026-03-01T09:00:00", "big_bend"), // rare in Big Bend
      c("black_bear", "2026-07-01T09:00:00", "yellowstone"), // uncommon in Yellowstone
    ]);
    expect(p.xp).toBe(2 * XP_NEW_PARK + XP_FIRST_CATCH.rare + XP_FIRST_CATCH.uncommon);
    expect(p.earnedBadgeIds.has("park_hopper")).toBe(true);
  });

  it("is order-independent", () => {
    const catches = [c("coyote", "2026-03-02T09:00:00"), c("coyote", "2026-03-01T09:00:00")];
    expect(computeProgress(catches).xp).toBe(computeProgress([...catches].reverse()).xp);
  });

  it("stamps a park on first catch and golds it on completion", () => {
    const one = computeProgress([c("coyote", "2026-03-01T09:00:00")]);
    expect(one.parks.find((p) => p.park.id === "big_bend")?.stamp).toBe("stamped");

    const all = computeProgress(BIG_BEND.entries.map((e) => c(e.species_id, "2026-03-01T12:00:00")));
    expect(all.parks.find((p) => p.park.id === "big_bend")?.stamp).toBe("gold");
    expect(all.earnedBadgeIds.has("completionist")).toBe(true);
    expect(all.earnedBadgeIds.has("legendary")).toBe(true);
  });

  it("earns time-of-day and family badges", () => {
    const p = computeProgress([
      c("ringtail", "2026-03-01T22:30:00"),
      c("coyote", "2026-03-02T06:00:00"),
      c("gray_fox", "2026-03-02T12:00:00"),
      c("gray_wolf", "2026-07-02T12:00:00", "yellowstone"),
    ]);
    expect(p.earnedBadgeIds.has("night_owl")).toBe(true);
    expect(p.earnedBadgeIds.has("early_bird")).toBe(true);
    expect(p.earnedBadgeIds.has("canid_collector")).toBe(true);
  });

  it("groups catches into trips by park and time gap", () => {
    const p = computeProgress([
      c("coyote", "2026-03-01T09:00:00"),
      c("javelina", "2026-03-02T09:00:00"),
      c("coyote", "2026-06-01T09:00:00"), // months later: new trip
    ]);
    expect(p.trips).toHaveLength(2);
    expect(p.trips[0].newSpeciesIds).toEqual([]); // most recent first; coyote already seen
    expect(p.trips[1].newSpeciesIds).toEqual(["coyote", "javelina"]);
  });
});

describe("diffProgress", () => {
  it("reports XP, badges, stamp, and rank-up from a catch", () => {
    const before = computeProgress([]);
    const after = computeProgress([c("mountain_lion", "2026-03-01T15:00:00")]);
    const delta = diffProgress(before, after);
    expect(delta.xpGained).toBe(XP_NEW_PARK + XP_FIRST_CATCH.legendary);
    expect(delta.newBadges.map((b) => b.id).sort()).toEqual(["first_catch", "legendary"]);
    expect(delta.newStamp).toEqual({ park: expect.objectContaining({ id: "big_bend" }), level: "stamped" });
    expect(delta.rankUp?.name).toBe("Ranger"); // 700 XP crosses 500
  });
});

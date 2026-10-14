/// <reference types="jest" />
import AsyncStorage from "@react-native-async-storage/async-storage";
import { findParkAt, getParkSpecies, PARKS } from "../data/parks";
import { getAllCatches } from "../store/catches";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("parks data", () => {
  it("every park entry resolves to a catalog species, with no duplicates", () => {
    for (const park of PARKS) {
      expect(getParkSpecies(park)).toHaveLength(park.entries.length);
      expect(new Set(park.entries.map((e) => e.species_id)).size).toBe(park.entries.length);
    }
  });

  it("finds the park containing a point", () => {
    expect(findParkAt({ lat: 29.27, lon: -103.3 })?.id).toBe("big_bend"); // Chisos Basin
    expect(findParkAt({ lat: 44.46, lon: -110.83 })?.id).toBe("yellowstone"); // Old Faithful
    expect(findParkAt({ lat: 40.71, lon: -74.0 })).toBeUndefined(); // New York
  });
});

describe("catch storage migration", () => {
  it("assigns pre-multi-park catches to Big Bend", async () => {
    await AsyncStorage.setItem(
      "rangervault:catches",
      JSON.stringify([
        { id: "old", species_id: "coyote", photo_uri: "x", caught_at: "2026-08-10T00:00:00Z", confidence_score: 0.8 },
        { id: "new", species_id: "elk", park_id: "yellowstone", photo_uri: "y", caught_at: "2026-09-10T00:00:00Z", confidence_score: 0.9 },
      ])
    );
    const all = await getAllCatches();
    expect(all.find((c) => c.id === "old")?.park_id).toBe("big_bend");
    expect(all.find((c) => c.id === "new")?.park_id).toBe("yellowstone");
  });
});

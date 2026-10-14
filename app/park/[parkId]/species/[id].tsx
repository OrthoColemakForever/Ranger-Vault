import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getParkById, getParkEntry } from "../../../../data/parks";
import { RARITY_COLOR, RARITY_LABEL } from "../../../../data/rarity";
import type { Catch } from "../../../../data/types";
import { getCatchesBySpecies } from "../../../../store/catches";
// DEV-ONLY (remove before launch): see store/devPreview.ts.
import { getDevPreviewDiscoveredIds, setDevPreviewDiscovered } from "../../../../store/devPreview";
import { SpeciesSprite } from "../../../../components/SpeciesSprite";

export default function SpeciesDetailScreen() {
  const { parkId, id } = useLocalSearchParams<{ parkId: string; id: string }>();
  const park = getParkById(parkId);
  const entry = park ? getParkEntry(park, id) : undefined;
  const species = entry?.species;
  const [catches, setCatches] = useState<Catch[]>([]);

  // DEV-ONLY (remove before launch): mirrors the vault page's "found"
  // state for this one species, so you can flip it here and see the
  // vault grid card + found count update without an actual catch. Does
  // NOT touch the hero image or the real sightings gallery below — those
  // only ever reflect real Catch records.
  const [devPreview, setDevPreview] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!species) return;
      let cancelled = false;
      Promise.all([
        getCatchesBySpecies(parkId, species.id),
        getDevPreviewDiscoveredIds(parkId),
      ]).then(([list, devIds]) => {
        if (!cancelled) {
          setCatches(list);
          setDevPreview(devIds.has(species.id));
        }
      });
      return () => {
        cancelled = true;
      };
    }, [species, parkId])
  );

  if (!species || !entry) {
    return (
      <View style={styles.container}>
        <Text>Species not found.</Text>
      </View>
    );
  }

  async function toggleDevPreview(next: boolean) {
    setDevPreview(next); // optimistic — vault page re-reads on focus anyway
    await setDevPreviewDiscovered(parkId, species!.id, next);
  }

  const caught = catches.length > 0;
  // getCatchesBySpecies returns newest-first; the hero shows the very
  // first photo ever taken of this species, and the gallery below shows
  // every capture after that one (still newest-first).
  const heroPhoto = caught
    ? [...catches].sort((a, b) => a.caught_at.localeCompare(b.caught_at))[0]
    : undefined;
  const galleryCatches = heroPhoto ? catches.filter((c) => c.id !== heroPhoto.id) : [];

  return (
    <>
      <Stack.Screen options={{ title: species.common_name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* DEV-ONLY (remove before launch) */}
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>
            DEV PREVIEW — {devPreview
              ? "counted as found on the vault page + gallery layout shown below"
              : "not found on the vault page"}
          </Text>
          <Switch value={devPreview} onValueChange={toggleDevPreview} />
        </View>

        {heroPhoto ? (
          <Image source={{ uri: heroPhoto.photo_uri }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroImage}>
            <SpeciesSprite species={species} caught={false} />
          </View>
        )}

        <Text style={styles.commonName}>{species.common_name}</Text>
        <Text style={styles.scientificName}>{species.scientific_name}</Text>
        <Text style={[styles.rarity, { color: RARITY_COLOR[entry.rarity] }]}>
          {RARITY_LABEL[entry.rarity]} in {park!.name}
        </Text>

        <Text style={styles.status}>
          {caught
            ? `Caught ${catches.length} time${catches.length === 1 ? "" : "s"}`
            : "Not yet caught — go find one in the park!"}
        </Text>

        <Text style={styles.factBlurb}>{entry.fact_blurb}</Text>

        <View style={styles.hintRow}>
          <Text style={styles.hintLabel}>Where to look</Text>
          <Text style={styles.hintText}>{entry.location_hint}</Text>
        </View>

        {/* DEV-ONLY: devPreview also reveals this section (per the toggle
            above) so its layout can be checked even with zero real
            catches — remove `|| devPreview` before launch. */}
        {(caught || devPreview) && (
          <View style={styles.sightingsSection}>
            <Text style={styles.sectionTitle}>Your Sightings</Text>
            {galleryCatches.length === 0 ? (
              <Text style={styles.noSightingsText}>
                {caught
                  ? "No other sightings yet — the photo above is the only one so far."
                  : "No real sightings yet — this is a dev preview of the gallery layout."}
              </Text>
            ) : (
              galleryCatches.map((c) => (
                <View key={c.id} style={styles.sightingRow}>
                  <Image source={{ uri: c.photo_uri }} style={styles.sightingThumb} />
                  <View style={styles.sightingInfo}>
                    <Text style={styles.sightingDate}>
                      {new Date(c.caught_at).toLocaleString()}
                    </Text>
                    <Text style={styles.sightingConfidence}>
                      Confidence: {(c.confidence_score * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Same beige as the vault/collection page background.
    backgroundColor: "#ece0c8",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff4d6",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c9a227",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  devBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7a6110",
    flexShrink: 1,
    marginRight: 8,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#e8e4da",
  },
  commonName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2b2a25",
    marginTop: 16,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#6b6759",
    marginTop: 2,
  },
  rarity: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 6,
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5b6b3f",
    marginTop: 12,
  },
  factBlurb: {
    fontSize: 16,
    lineHeight: 23,
    color: "#3d3a2f",
    marginTop: 16,
  },
  hintRow: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#e8e4da",
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#5b6b3f",
    marginBottom: 4,
  },
  hintText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#3d3a2f",
  },
  sightingsSection: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b2a25",
    marginBottom: 12,
  },
  noSightingsText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#6b6759",
  },
  sightingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sightingThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#e8e4da",
    marginRight: 12,
  },
  sightingInfo: {
    flex: 1,
  },
  sightingDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2b2a25",
  },
  sightingConfidence: {
    fontSize: 13,
    color: "#6b6759",
    marginTop: 2,
  },
});

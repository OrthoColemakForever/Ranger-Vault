import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getParkById, getParkSpecies } from "../../../data/parks";
import type { Catch } from "../../../data/types";
import { getAllCatches } from "../../../store/catches";
// DEV-ONLY (remove before launch): see store/devPreview.ts.
import { getDevPreviewDiscoveredIds } from "../../../store/devPreview";
import { SpeciesCard } from "../../../components/SpeciesCard";
import { FieldNotesBanner } from "../../../components/FieldNotesBanner";

export default function VaultScreen() {
  const { parkId } = useLocalSearchParams<{ parkId: string }>();
  const park = getParkById(parkId);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [devPreviewIds, setDevPreviewIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    Promise.all([getAllCatches(), getDevPreviewDiscoveredIds(parkId)]).then(([all, devIds]) => {
      if (!cancelled) {
        setCatches(all.filter((c) => c.park_id === parkId));
        setDevPreviewIds(devIds);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [parkId]);

  // Refresh every time the vault regains focus (e.g. coming back from a
  // successful catch on the camera screen, or from toggling a species'
  // dev preview flag on its detail page) rather than only on mount.
  useFocusEffect(load);

  if (!park) {
    return (
      <View style={styles.container}>
        <Text>Park not found.</Text>
      </View>
    );
  }

  const entries = getParkSpecies(park);
  const latestCatchBySpecies = new Map<string, Catch>();
  for (const c of catches) {
    const existing = latestCatchBySpecies.get(c.species_id);
    if (!existing || c.caught_at > existing.caught_at) {
      latestCatchBySpecies.set(c.species_id, c);
    }
  }
  // A species counts as found if it has a real catch OR its dev preview
  // flag is on — see store/devPreview.ts.
  const caughtIds = new Set([...latestCatchBySpecies.keys(), ...devPreviewIds]);
  const caughtCount = entries.filter((e) => caughtIds.has(e.species_id)).length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: park.name, headerStyle: { backgroundColor: park.accent_color } }} />
      <View style={styles.header}>
        <FieldNotesBanner onCatchesChanged={load} />
        <Text style={styles.progress}>
          {caughtCount} / {entries.length} found
        </Text>
        <Pressable
          style={styles.identifyButton}
          onPress={() => router.push({ pathname: "/camera", params: { parkId: park.id } })}
        >
          <Text style={styles.identifyButtonText}>Identify Wildlife</Text>
        </Pressable>
      </View>

      <FlatList
        data={entries}
        // `entries` is rebuilt every render but its items are the same
        // shape, so FlatList can't tell a card needs re-rendering when only
        // caughtIds changes (e.g. via the dev preview toggle) — extraData
        // forces it to on every caughtIds change.
        extraData={caughtIds}
        keyExtractor={(e) => e.species_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <SpeciesCard
            entry={item}
            caught={caughtIds.has(item.species_id)}
            photoUri={latestCatchBySpecies.get(item.species_id)?.photo_uri}
            onPress={() => router.push(`/park/${park.id}/species/${item.species_id}`)}
          />
        )}
        ListEmptyComponent={loaded ? <Text>No species configured.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ece0c8",
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  progress: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3d3a2f",
    marginBottom: 12,
  },
  identifyButton: {
    backgroundColor: "#5b6b3f",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  identifyButtonText: {
    color: "#f5f1e6",
    fontSize: 16,
    fontWeight: "700",
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
  },
});

import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { findParkAt } from "../data/parks";
import { getAllCatches } from "../store/catches";
import { computeProgress, type Progress } from "../services/progress";
import { FieldNotesBanner } from "../components/FieldNotesBanner";
import { ProgressBar } from "../components/ProgressBar";
import { StampBadge } from "../components/StampBadge";

/** Passport home: rank summary + every park with its completion stamp. */
export default function PassportScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [hereParkId, setHereParkId] = useState<string | undefined>();

  const load = useCallback(() => {
    let cancelled = false;
    getAllCatches().then((all) => {
      if (!cancelled) setProgress(computeProgress(all));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useFocusEffect(load);

  // "You're in X" — only if location was already granted (the camera
  // screen asks); the home screen shouldn't open with a permission prompt.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted) return;
        const pos = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 });
        if (!cancelled && pos) {
          setHereParkId(findParkAt({ lat: pos.coords.latitude, lon: pos.coords.longitude })?.id);
        }
      })().catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!progress) return <View style={styles.container} />;

  const { rank, nextRank, xp } = progress;
  const rankFraction = nextRank ? (xp - rank.minXp) / (nextRank.minXp - rank.minXp) : 1;
  // The park you're standing in floats to the top.
  const parks = [...progress.parks].sort(
    (a, b) => Number(b.park.id === hereParkId) - Number(a.park.id === hereParkId)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.rankCard} onPress={() => router.push("/profile")}>
        <View style={styles.rankRow}>
          <Text style={styles.rankName}>{rank.name}</Text>
          <Text style={styles.xp}>{xp} XP</Text>
        </View>
        <ProgressBar fraction={rankFraction} color="#b8862b" />
        <Text style={styles.rankNext}>
          {nextRank ? `${nextRank.minXp - xp} XP to ${nextRank.name}` : "Top rank reached"} · View profile ›
        </Text>
      </Pressable>

      <FieldNotesBanner onCatchesChanged={load} />

      <Pressable style={styles.identifyButton} onPress={() => router.push("/camera")}>
        <Text style={styles.identifyButtonText}>Identify Wildlife</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Park Passport</Text>
      {parks.map(({ park, caughtCount, total, stamp }) => (
        <Pressable key={park.id} style={styles.parkCard} onPress={() => router.push(`/park/${park.id}`)}>
          <StampBadge park={park} level={stamp} size={56} />
          <View style={styles.parkInfo}>
            <View style={styles.parkTitleRow}>
              <Text style={styles.parkName}>{park.name}</Text>
              {park.id === hereParkId && <Text style={styles.hereChip}>📍 You&apos;re here</Text>}
            </View>
            <Text style={styles.parkState}>{park.state}</Text>
            <ProgressBar fraction={total ? caughtCount / total : 0} color={park.accent_color} />
            <Text style={styles.parkCount}>
              {caughtCount} / {total} found
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ece0c8",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  rankCard: {
    backgroundColor: "#f5f1e6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  rankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  rankName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2b2a25",
  },
  xp: {
    fontSize: 15,
    fontWeight: "700",
    color: "#b8862b",
  },
  rankNext: {
    fontSize: 12,
    color: "#6b6759",
    marginTop: 6,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b2a25",
    marginTop: 24,
    marginBottom: 12,
  },
  parkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f1e6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  parkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  parkTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  parkName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2b2a25",
  },
  hereChip: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5b6b3f",
  },
  parkState: {
    fontSize: 13,
    color: "#6b6759",
    marginBottom: 6,
  },
  parkCount: {
    fontSize: 12,
    color: "#6b6759",
    marginTop: 4,
  },
});

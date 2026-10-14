import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { BADGES } from "../data/badges";
import { getParkById } from "../data/parks";
import { getSpeciesById } from "../data/species";
import { getAllCatches } from "../store/catches";
import { computeProgress, RANKS, type Progress } from "../services/progress";
import { ProgressBar } from "../components/ProgressBar";
import { StampBadge } from "../components/StampBadge";

function formatRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const start = new Date(startIso).toLocaleDateString(undefined, opts);
  const end = new Date(endIso).toLocaleDateString(undefined, opts);
  return start === end ? start : `${start} – ${end}`;
}

export default function ProfileScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getAllCatches().then((all) => {
        if (!cancelled) setProgress(computeProgress(all));
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!progress) return <View style={styles.container} />;
  const { rank, nextRank, xp } = progress;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.rankName}>{rank.name}</Text>
        <Text style={styles.xp}>{xp} XP</Text>
        <ProgressBar
          fraction={nextRank ? (xp - rank.minXp) / (nextRank.minXp - rank.minXp) : 1}
          color="#b8862b"
        />
        <Text style={styles.muted}>
          {nextRank ? `${nextRank.minXp - xp} XP to ${nextRank.name}` : "You've reached the top rank."}
        </Text>
        <View style={styles.rankLadder}>
          {RANKS.map((r) => (
            <Text key={r.name} style={[styles.ladderItem, xp >= r.minXp && styles.ladderReached]}>
              {xp >= r.minXp ? "●" : "○"} {r.name} · {r.minXp} XP
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Passport Stamps</Text>
      <View style={styles.stampRow}>
        {progress.parks.map(({ park, stamp }) => (
          <View key={park.id} style={styles.stampItem}>
            <StampBadge park={park} level={stamp} size={72} />
            <Text style={styles.stampLabel}>{park.name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        Badges ({progress.earnedBadgeIds.size}/{BADGES.length})
      </Text>
      <View style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const earned = progress.earnedBadgeIds.has(b.id);
          return (
            <View key={b.id} style={[styles.badge, !earned && styles.badgeLocked]}>
              <Text style={styles.badgeIcon}>{earned ? b.icon : "🔒"}</Text>
              <Text style={styles.badgeName}>{b.name}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Trips</Text>
      {progress.trips.length === 0 ? (
        <Text style={styles.muted}>Your park trips will show up here after your first catch.</Text>
      ) : (
        progress.trips.map((trip) => {
          const tripXp = trip.catches.reduce((sum, c) => sum + (progress.xpByCatch.get(c.id) ?? 0), 0);
          return (
            <View key={`${trip.park_id}_${trip.start}`} style={styles.card}>
              <Text style={styles.tripTitle}>{getParkById(trip.park_id)?.name ?? trip.park_id}</Text>
              <Text style={styles.muted}>{formatRange(trip.start, trip.end)}</Text>
              <Text style={styles.tripStats}>
                {trip.catches.length} catch{trip.catches.length === 1 ? "" : "es"} · +{tripXp} XP
              </Text>
              {trip.newSpeciesIds.length > 0 && (
                <Text style={styles.tripNew}>
                  New: {trip.newSpeciesIds.map((id) => getSpeciesById(id)?.common_name ?? id).join(", ")}
                </Text>
              )}
            </View>
          );
        })
      )}
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
  card: {
    backgroundColor: "#f5f1e6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  rankName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2b2a25",
  },
  xp: {
    fontSize: 16,
    fontWeight: "700",
    color: "#b8862b",
    marginBottom: 8,
  },
  muted: {
    fontSize: 13,
    color: "#6b6759",
    marginTop: 4,
  },
  rankLadder: {
    marginTop: 12,
  },
  ladderItem: {
    fontSize: 13,
    color: "#a39d8c",
    marginTop: 2,
  },
  ladderReached: {
    color: "#3d3a2f",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b2a25",
    marginTop: 16,
    marginBottom: 12,
  },
  stampRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  stampItem: {
    alignItems: "center",
  },
  stampLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#3d3a2f",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  badge: {
    width: "48%",
    backgroundColor: "#f5f1e6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  badgeLocked: {
    opacity: 0.55,
  },
  badgeIcon: {
    fontSize: 30,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2b2a25",
    marginTop: 4,
  },
  badgeDesc: {
    fontSize: 12,
    color: "#6b6759",
    textAlign: "center",
    marginTop: 2,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2b2a25",
  },
  tripStats: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3d3a2f",
    marginTop: 6,
  },
  tripNew: {
    fontSize: 13,
    color: "#5b6b3f",
    marginTop: 4,
  },
});

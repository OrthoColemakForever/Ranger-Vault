import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BADGES } from "../data/badges";
import { getParkById, getParkEntry } from "../data/parks";
import { RARITY_COLOR, RARITY_LABEL } from "../data/rarity";
import type { CatchResult } from "../services/catchFlow";

interface Props {
  visible: boolean;
  result: CatchResult | null;
  onClose: () => void;
  onViewSpecies?: (parkId: string, speciesId: string) => void;
  /** Overrides the secondary button label (e.g. "Next" when stepping through field notes). */
  closeLabel?: string;
}

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

export function CatchResultModal({ visible, result, onClose, onViewSpecies, closeLabel }: Props) {
  if (!result) return null;

  const park = "park_id" in result ? getParkById(result.park_id) : undefined;
  const entry = park && "species_id" in result ? getParkEntry(park, result.species_id) : undefined;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {"photoUri" in result && <Image source={{ uri: result.photoUri }} style={styles.photo} />}

          {result.kind === "match" && entry && (
            <>
              <Text style={styles.badgeMatch}>CAUGHT</Text>
              <Text style={styles.title}>{entry.species.common_name}!</Text>
              <Text style={[styles.rarity, { color: RARITY_COLOR[entry.rarity] }]}>
                {RARITY_LABEL[entry.rarity]} · {pct(result.confidence)} confidence
              </Text>

              <View style={styles.rewards}>
                <Text style={styles.xp}>+{result.xpGained} XP</Text>
                {result.rankUpName && (
                  <Text style={styles.reward}>⬆️ Promoted to {result.rankUpName}!</Text>
                )}
                {result.newStamp && (
                  <Text style={styles.reward}>
                    {result.newStamp.level === "gold"
                      ? `🥇 Gold stamp — you've found every animal in ${getParkById(result.newStamp.park_id)?.name}!`
                      : `🎫 New passport stamp: ${getParkById(result.newStamp.park_id)?.name}`}
                  </Text>
                )}
                {result.newBadgeIds.map((id) => {
                  const badge = BADGES.find((b) => b.id === id);
                  return badge ? (
                    <Text key={id} style={styles.reward}>
                      {badge.icon} Badge earned: {badge.name}
                    </Text>
                  ) : null;
                })}
              </View>

              <Text style={styles.body}>{entry.fact_blurb}</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => onViewSpecies?.(result.park_id, result.species_id)}
              >
                <Text style={styles.primaryButtonText}>View in Vault</Text>
              </Pressable>
            </>
          )}

          {result.kind === "no_confident_match" && entry && (
            <>
              <Text style={styles.badgeUnsure}>NOT SURE</Text>
              <Text style={styles.title}>Possibly a {entry.species.common_name}</Text>
              <Text style={styles.subtitle}>
                Only {pct(result.confidence)} confidence, which is too low to count. Not logged as a catch.
              </Text>
              <Text style={styles.body}>
                Try a clearer, closer photo with the animal well-lit and centered in frame.
              </Text>
            </>
          )}

          {result.kind === "not_in_park" && (
            <>
              <Text style={styles.badgeMiss}>NO MATCH</Text>
              <Text style={styles.title}>
                {result.bestGuessName ? `Looks like: ${result.bestGuessName}` : "Not one we're tracking"}
              </Text>
              <Text style={styles.body}>
                That isn't one of the {park?.entries.length ?? ""} animals on {park?.name ?? "this park"}&apos;s list.
              </Text>
            </>
          )}

          {result.kind === "no_animal" && (
            <>
              <Text style={styles.badgeMiss}>NO ANIMAL</Text>
              <Text style={styles.title}>Couldn&apos;t spot an animal</Text>
              <Text style={styles.body}>Get the animal clearly in frame and try again.</Text>
            </>
          )}

          {result.kind === "not_live" && (
            <>
              <Text style={styles.badgeMiss}>NOT A LIVE SIGHTING</Text>
              <Text style={styles.title}>
                {result.subject === "screen_or_print" ? "That's a picture of a picture" : "That's not the real thing"}
              </Text>
              <Text style={styles.body}>
                Catches have to be live animals you see in the park. Screens, signs, photos, statues, and
                toys don&apos;t count.
              </Text>
            </>
          )}

          {result.kind === "queued" && (
            <>
              <Text style={styles.badgeUnsure}>SAVED FOR LATER</Text>
              <Text style={styles.title}>No signal out here</Text>
              <Text style={styles.body}>
                Your photo is saved. We&apos;ll identify it automatically once you&apos;re back in range, and
                you&apos;ll find the result in your field notes.
              </Text>
            </>
          )}

          {result.kind === "error" && (
            <>
              <Text style={styles.badgeMiss}>ERROR</Text>
              <Text style={styles.title}>Couldn&apos;t identify photo</Text>
              <Text style={styles.body}>{result.message}</Text>
            </>
          )}

          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>
              {closeLabel ?? (result.kind === "match" || result.kind === "queued" ? "Catch Another" : "Try Again")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const badgeBase = { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 4 } as const;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f5f1e6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#e8e4da",
  },
  badgeMatch: { ...badgeBase, color: "#5b6b3f" },
  badgeUnsure: { ...badgeBase, color: "#a8792f" },
  badgeMiss: { ...badgeBase, color: "#a13d3d" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2b2a25",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b6759",
    marginTop: 6,
    textAlign: "center",
  },
  rarity: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  rewards: {
    marginTop: 14,
    alignItems: "center",
  },
  xp: {
    fontSize: 20,
    fontWeight: "800",
    color: "#b8862b",
  },
  reward: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3d3a2f",
    marginTop: 6,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: "#3d3a2f",
    marginTop: 14,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#5b6b3f",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#f5f1e6",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#6b6759",
    fontSize: 15,
    fontWeight: "600",
  },
});

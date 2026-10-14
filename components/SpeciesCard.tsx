import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ParkSpecies } from "../data/parks";
import { RARITY_COLOR, RARITY_LABEL } from "../data/rarity";
import { SpeciesSprite } from "./SpeciesSprite";

interface Props {
  entry: ParkSpecies;
  caught: boolean;
  /** Latest catch photo, used when the species has no bundled art. */
  photoUri?: string;
  onPress: () => void;
}

export function SpeciesCard({ entry, caught, photoUri, onPress }: Props) {
  const rarityColor = RARITY_COLOR[entry.rarity];
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Rarity shows as the frame color once caught; uncaught cards stay
          neutral so the grid doesn't spoil which slots are the rare ones —
          the rarity label underneath still hints at it. */}
      <View style={[styles.thumb, { borderColor: caught ? rarityColor : "transparent" }]}>
        <SpeciesSprite species={entry.species} caught={caught} photoUri={photoUri} />
      </View>
      <Text style={[styles.name, !caught && styles.nameUncaught]} numberOfLines={1}>
        {caught ? entry.species.common_name : "Not Discovered"}
      </Text>
      <Text style={[styles.rarity, { color: rarityColor }]}>{RARITY_LABEL[entry.rarity]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    marginBottom: 16,
  },
  thumb: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 3,
    overflow: "hidden",
  },
  name: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2b2a25",
    textAlign: "center",
  },
  nameUncaught: {
    color: "#8f8a7c",
  },
  rarity: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 2,
  },
});

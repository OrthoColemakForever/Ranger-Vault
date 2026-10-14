import { StyleSheet, Text, View } from "react-native";
import type { Park } from "../data/types";
import type { StampLevel } from "../services/progress";

interface Props {
  park: Park;
  level: StampLevel;
  size: number;
}

/**
 * Passport stamp, drawn in code until there's real stamp art: a dashed
 * outline before the first catch, the park's color once stamped, gold at
 * 100% completion.
 */
export function StampBadge({ park, level, size }: Props) {
  const color = level === "gold" ? "#b8862b" : park.accent_color;
  const initials = park.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={[
        styles.stamp,
        { width: size, height: size, borderRadius: size / 2 },
        level === "none"
          ? styles.empty
          : { borderColor: color, backgroundColor: level === "gold" ? "#f3e2b3" : "#f5f1e6" },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.32, color: level === "none" ? "#c9c2b0" : color }]}>
        {initials}
      </Text>
      {level === "gold" && <Text style={[styles.star, { fontSize: size * 0.22 }]}>★</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
  },
  empty: {
    borderColor: "#c9c2b0",
    borderStyle: "dashed",
  },
  initials: {
    fontWeight: "900",
    letterSpacing: 1,
  },
  star: {
    position: "absolute",
    bottom: 2,
    color: "#b8862b",
  },
});

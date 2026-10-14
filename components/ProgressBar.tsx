import { StyleSheet, View } from "react-native";

interface Props {
  /** 0–1; clamped. */
  fraction: number;
  color: string;
}

export function ProgressBar({ fraction, color }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0d6c0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

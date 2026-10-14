import { Image, StyleSheet, Text, View } from "react-native";
import type { Species } from "../data/types";
import {
  DISCOVERED_SPRITE_BG,
  QUESTION_MARK_COLOR,
  SILHOUETTE_SHAPE_COLOR,
  SILHOUETTE_SPRITE_BG,
} from "../data/spriteColors";

interface Props {
  species: Species;
  caught: boolean;
  /** The user's own photo — the "caught" fallback for species with no bundled discovered_image. */
  photoUri?: string;
}

/**
 * Species art in its caught / not-yet-caught state, filling its parent
 * (give the parent a size). Shared by the vault card and the detail hero.
 *
 * Fallbacks for species without bundled art (2026-10-14, so new parks don't
 * block on sprites): caught → the user's own photo, edge to edge; not
 * caught → a plain "?" on the silhouette background.
 */
export function SpeciesSprite({ species, caught, photoUri }: Props) {
  if (caught && !species.discovered_image && photoUri) {
    return <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />;
  }

  const hasSilhouette = species.silhouette_shape_image && species.question_mark_image;
  if (!caught && !hasSilhouette) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: SILHOUETTE_SPRITE_BG }]}>
        <Text style={styles.placeholderMark}>?</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fill,
        styles.padded,
        { backgroundColor: caught ? DISCOVERED_SPRITE_BG : SILHOUETTE_SPRITE_BG },
      ]}
    >
      {/* Both states share one padded + sprite_scale-transformed wrapper
          so an animal reads as the same size whether caught or not —
          both discovered_image and the silhouette pair are tight-cropped
          transparent cutouts with zero baked-in margin (see
          data/spriteColors.ts). */}
      <View style={[styles.fill, { transform: [{ scale: species.sprite_scale ?? 1 }] }]}>
        {caught ? (
          species.discovered_image ? (
            <Image source={species.discovered_image} style={styles.fill} resizeMode="contain" />
          ) : (
            // Caught, no art, and no photo handy (e.g. dev preview).
            <View style={[styles.fill, styles.center]}>
              <Text style={styles.caughtName}>{species.common_name}</Text>
            </View>
          )
        ) : (
          // Two tintable alpha masks stacked exactly on top of each other.
          <>
            <Image
              source={species.silhouette_shape_image}
              style={styles.stackedImage}
              resizeMode="contain"
              tintColor={SILHOUETTE_SHAPE_COLOR}
            />
            <Image
              source={species.question_mark_image}
              style={styles.stackedImage}
              resizeMode="contain"
              tintColor={QUESTION_MARK_COLOR}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  padded: {
    padding: "8%",
  },
  stackedImage: {
    // Deliberately width/height 100% ONLY, no top/left/right/bottom insets
    // — combining both on an absolutely-positioned child inside a *padded*
    // parent double-counts in RN's Yoga layout (sizes against the full
    // border box while positioning against the padding box), which is why
    // sprites were overflowing past the padding and getting clipped by
    // the container's overflow:hidden instead of sitting centered inside it.
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  placeholderMark: {
    fontSize: 64,
    fontWeight: "800",
    color: QUESTION_MARK_COLOR,
  },
  caughtName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3d3a2f",
    textAlign: "center",
  },
});

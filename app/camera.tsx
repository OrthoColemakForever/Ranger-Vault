import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { findParkAt, getParkById, PARKS } from "../data/parks";
import { identifyCapture, type CatchResult } from "../services/catchFlow";
import { CatchResultModal } from "../components/CatchResultModal";

interface Shot {
  uri: string;
  takenAt: string;
}

export default function CameraScreen() {
  // Coming from a park's vault pins that park; from the passport home it's
  // auto-detected from GPS (and can always be changed with the chips).
  const { parkId: parkParam } = useLocalSearchParams<{ parkId?: string }>();
  const [parkId, setParkId] = useState<string | undefined>(
    parkParam && getParkById(parkParam) ? parkParam : undefined
  );
  const [detectedParkId, setDetectedParkId] = useState<string | undefined>();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | undefined>();

  const [shot, setShot] = useState<Shot | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<CatchResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Location is best-effort: it tags the catch and picks the park, but
  // nothing breaks if it's denied or slow (common deep in a canyon).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (cancelled || !pos) return;
      const point = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setCoords(point);
      const park = findParkAt(point);
      if (park) {
        setDetectedParkId(park.id);
        setParkId((current) => current ?? park.id);
      }
    })().catch(() => {
      // Location services off / timed out — the park chips still work.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setShot({ uri: res.assets[0].uri, takenAt: new Date().toISOString() });
      setResult(null);
    }
  }

  // DEV-ONLY: the iOS simulator has no camera. Release builds stay
  // live-capture only (see the comment on the Take Photo button).
  async function pickFromLibraryDev() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setShot({ uri: res.assets[0].uri, takenAt: new Date().toISOString() });
      setResult(null);
    }
  }

  async function identify() {
    const park = parkId ? getParkById(parkId) : undefined;
    if (!shot || !park) return;
    setIdentifying(true);
    try {
      const next = await identifyCapture({
        photoUri: shot.uri,
        park,
        takenAt: shot.takenAt,
        lat: coords?.lat,
        lon: coords?.lon,
      });
      setResult(next);
      setModalVisible(true);
    } finally {
      setIdentifying(false);
    }
  }

  function closeModal() {
    setModalVisible(false);
    setShot(null);
    setResult(null);
  }

  function viewSpecies(resultParkId: string, speciesId: string) {
    setModalVisible(false);
    router.replace(`/park/${resultParkId}/species/${speciesId}`);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.parkRow}
        contentContainerStyle={styles.parkRowContent}
      >
        {PARKS.map((p) => {
          const selected = p.id === parkId;
          return (
            <Pressable
              key={p.id}
              onPress={() => setParkId(p.id)}
              style={[styles.parkChip, selected && { backgroundColor: p.accent_color, borderColor: p.accent_color }]}
            >
              <Text style={[styles.parkChipText, selected && styles.parkChipTextSelected]}>
                {p.id === detectedParkId ? "📍 " : ""}
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {!parkId && <Text style={styles.parkHint}>Which park are you in?</Text>}

      <View style={styles.previewArea}>
        {shot ? (
          <Image source={{ uri: shot.uri }} style={styles.preview} />
        ) : (
          <Text style={styles.placeholderText}>Take a photo of an animal to identify it.</Text>
        )}
      </View>

      <View style={styles.actions}>
        {!shot ? (
          <>
            {/* Live capture only, deliberately — no photo-library picker, so
                every catch is verifiably something the user actually saw in
                the park just now, not an old photo pulled from their camera roll. */}
            <Pressable style={styles.primaryButton} onPress={pickFromCamera}>
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </Pressable>
            {__DEV__ && (
              <Pressable style={styles.secondaryButton} onPress={pickFromLibraryDev}>
                <Text style={styles.devButtonText}>DEV: Pick from library</Text>
              </Pressable>
            )}
          </>
        ) : identifying ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#5b6b3f" />
            <Text style={styles.loadingText}>Identifying...</Text>
          </View>
        ) : (
          <>
            <Pressable
              style={[styles.primaryButton, !parkId && styles.primaryButtonDisabled]}
              onPress={identify}
              disabled={!parkId}
            >
              <Text style={styles.primaryButtonText}>{parkId ? "Identify" : "Pick a park first"}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setShot(null)}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </Pressable>
          </>
        )}
      </View>

      <CatchResultModal
        visible={modalVisible}
        result={result}
        onClose={closeModal}
        onViewSpecies={viewSpecies}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1e6",
    padding: 16,
  },
  parkRow: {
    flexGrow: 0,
    marginBottom: 8,
  },
  parkRowContent: {
    gap: 8,
  },
  parkChip: {
    borderWidth: 1,
    borderColor: "#c9c2b0",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  parkChipText: {
    color: "#3d3a2f",
    fontWeight: "600",
  },
  parkChipTextSelected: {
    color: "#f5f1e6",
  },
  parkHint: {
    color: "#a8792f",
    fontWeight: "600",
    marginBottom: 8,
  },
  previewArea: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#e8e4da",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholderText: {
    color: "#8f8a7c",
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  actions: {
    paddingVertical: 20,
  },
  primaryButton: {
    backgroundColor: "#5b6b3f",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#a7ad97",
  },
  primaryButtonText: {
    color: "#f5f1e6",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#6b6759",
    fontSize: 15,
    fontWeight: "600",
  },
  devButtonText: {
    color: "#7a6110",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 10,
    color: "#5b6b3f",
    fontSize: 16,
    fontWeight: "600",
  },
});

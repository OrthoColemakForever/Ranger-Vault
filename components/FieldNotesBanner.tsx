import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { dismissFieldNote, getFieldNotes, type FieldNote } from "../store/fieldNotes";
import { getPending } from "../store/pendingIdentifications";
import { processPendingQueue } from "../services/syncQueue";
import { CatchResultModal } from "./CatchResultModal";

interface Props {
  /** Called after the queue resolves anything, so the host screen can reload its catches. */
  onCatchesChanged?: () => void;
}

/**
 * On focus: tries to identify any photos queued while offline, then shows
 * "Field notes ready (N)" if there are results to reveal, or "N photos
 * waiting for signal" if not. Tapping steps through the results using the
 * normal catch result modal.
 */
export function FieldNotesBanner({ onCatchesChanged }: Props) {
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showing, setShowing] = useState(false);

  const refresh = useCallback(async () => {
    const [n, p] = await Promise.all([getFieldNotes(), getPending()]);
    setNotes(n);
    setPendingCount(p.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      refresh();
      processPendingQueue().then((resolved) => {
        if (cancelled || resolved === 0) return;
        refresh();
        onCatchesChanged?.();
      });
      return () => {
        cancelled = true;
      };
    }, [refresh, onCatchesChanged])
  );

  async function next() {
    const current = notes[0];
    if (!current) return;
    await dismissFieldNote(current.id);
    const rest = notes.slice(1);
    setNotes(rest);
    if (rest.length === 0) setShowing(false);
  }

  if (notes.length === 0 && pendingCount === 0) return null;

  return (
    <>
      {notes.length > 0 ? (
        <Pressable style={[styles.banner, styles.ready]} onPress={() => setShowing(true)}>
          <Text style={styles.readyText}>📓 Field notes ready ({notes.length}) — tap to reveal</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.banner, styles.waiting]} onPress={refresh}>
          <Text style={styles.waitingText}>
            📡 {pendingCount} photo{pendingCount === 1 ? "" : "s"} waiting for signal
          </Text>
        </Pressable>
      )}
      <CatchResultModal
        visible={showing && notes.length > 0}
        result={notes[0]?.result ?? null}
        onClose={next}
        closeLabel={notes.length > 1 ? "Next" : "Done"}
        onViewSpecies={async (parkId, speciesId) => {
          await next();
          setShowing(false);
          router.push(`/park/${parkId}/species/${speciesId}`);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  ready: {
    backgroundColor: "#5b6b3f",
  },
  readyText: {
    color: "#f5f1e6",
    fontWeight: "700",
    textAlign: "center",
  },
  waiting: {
    backgroundColor: "#e8e4da",
  },
  waitingText: {
    color: "#6b6759",
    fontWeight: "600",
    textAlign: "center",
  },
});

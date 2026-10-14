/**
 * Drains the offline queue (store/pendingIdentifications.ts) once there's
 * signal again. Called whenever the vault/passport screens regain focus.
 * Results become field notes (store/fieldNotes.ts) for the user to reveal.
 */

import * as Network from "expo-network";
import { getParkById } from "../data/parks";
import { addFieldNote } from "../store/fieldNotes";
import { getPending, removePending, updatePending } from "../store/pendingIdentifications";
import { deletePhoto } from "../store/photos";
import { identifyForPark, resolveResponse } from "./catchFlow";
import { OfflineError } from "./identify";

/** After this many non-network failures (e.g. the service rejecting the image) an item becomes an error note instead of retrying forever. */
const MAX_ATTEMPTS = 3;

let running = false;

/** Returns how many items were resolved this run. Safe to call repeatedly; overlapping calls are no-ops. */
export async function processPendingQueue(): Promise<number> {
  if (running) return 0;
  running = true;
  let resolved = 0;
  try {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) return 0;

    for (const item of await getPending()) {
      const park = getParkById(item.park_id);
      if (!park) {
        await removePending(item.id);
        deletePhoto(item.photo_uri);
        continue;
      }
      const capture = { photoUri: item.photo_uri, park, takenAt: item.taken_at, lat: item.lat, lon: item.lon };
      try {
        const response = await identifyForPark(capture);
        const result = await resolveResponse(capture, response);
        // A match copied the photo to its catch id; the pending copy is now redundant.
        if (result.kind === "match") deletePhoto(item.photo_uri);
        await addFieldNote({ id: item.id, result, created_at: new Date().toISOString() });
        await removePending(item.id);
        resolved++;
      } catch (err) {
        if (err instanceof OfflineError) break; // lost signal mid-run; try again later
        const attempts = item.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await addFieldNote({
            id: item.id,
            result: { kind: "error", message: "We couldn't identify this photo after several tries." },
            created_at: new Date().toISOString(),
          });
          await removePending(item.id);
          deletePhoto(item.photo_uri);
          resolved++;
        } else {
          await updatePending({ ...item, attempts });
        }
        break; // likely a service-side problem; don't hammer it
      }
    }
  } finally {
    running = false;
  }
  return resolved;
}

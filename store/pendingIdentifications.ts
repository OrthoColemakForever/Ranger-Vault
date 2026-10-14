/**
 * Photos taken with no signal, waiting to be identified. The photo itself
 * is already persisted (store/photos.ts) under the pending item's id.
 * Drained by services/syncQueue.ts.
 */

import { jsonList } from "./jsonList";

export interface PendingIdentification {
  id: string;
  photo_uri: string;
  park_id: string;
  /** When the photo was taken — becomes the catch's caught_at, not the time it was finally identified. */
  taken_at: string;
  lat?: number;
  lon?: number;
  /** Failed identification attempts (excluding "still offline"); the item gives up after a few. */
  attempts: number;
}

const list = jsonList<PendingIdentification>("rangervault:pending_identifications");

export const getPending = list.read;

export async function enqueuePending(item: PendingIdentification): Promise<void> {
  await list.write([...(await list.read()), item]);
}

export async function removePending(id: string): Promise<void> {
  await list.write((await list.read()).filter((p) => p.id !== id));
}

export async function updatePending(item: PendingIdentification): Promise<void> {
  await list.write((await list.read()).map((p) => (p.id === item.id ? item : p)));
}

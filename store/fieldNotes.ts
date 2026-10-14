/**
 * Results of offline photos that were identified later in the background,
 * waiting for the user to look at them ("Field notes ready" banner on the
 * vault). Any resulting catch is already saved; a field note is just the
 * reveal.
 */

import type { CatchResult } from "../services/catchFlow";
import { jsonList } from "./jsonList";
import { deletePhoto } from "./photos";

export interface FieldNote {
  id: string;
  result: CatchResult;
  created_at: string;
}

const list = jsonList<FieldNote>("rangervault:field_notes");

export const getFieldNotes = list.read;

export async function addFieldNote(note: FieldNote): Promise<void> {
  await list.write([...(await list.read()), note]);
}

/** Removes a note. Non-catch photos are only kept around so the note can show them, so they're deleted with it. */
export async function dismissFieldNote(id: string): Promise<void> {
  const notes = await list.read();
  const note = notes.find((n) => n.id === id);
  if (note && note.result.kind !== "match" && "photoUri" in note.result && note.result.photoUri) {
    deletePhoto(note.result.photoUri);
  }
  await list.write(notes.filter((n) => n.id !== id));
}

/**
 * Persistent photo storage.
 *
 * expo-image-picker hands back URIs in the app's cache directory, which the
 * OS may purge under storage pressure — fine for a preview, not for a
 * collection people expect to keep. Every photo that becomes a catch (or
 * waits in the offline queue) is copied into the document directory first.
 */

import { Directory, File, Paths } from "expo-file-system";

const photosDir = () => new Directory(Paths.document, "photos");

/** Copies `sourceUri` to `<document>/photos/<id>.jpg` and returns the new URI. Idempotent for an already-persisted source. */
export async function persistPhoto(sourceUri: string, id: string): Promise<string> {
  const dir = photosDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `${id}.jpg`);
  if (dest.uri === sourceUri) return dest.uri;
  if (dest.exists) dest.delete();
  await new File(sourceUri).copy(dest);
  return dest.uri;
}

/** Deletes a persisted photo; a missing file is not an error. */
export function deletePhoto(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}

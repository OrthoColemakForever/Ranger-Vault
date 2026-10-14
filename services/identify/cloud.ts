/**
 * Cloud engine: sends a downscaled photo to the RangerVault proxy
 * (proxy/src/index.ts), which asks Claude to pick from the park's
 * candidates. Needs signal; throws OfflineError when the request can't be
 * made at all so the caller can queue the photo for later.
 */

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { IdentifyError, OfflineError, type Identifier, type IdentifyResponse } from "./types";

const IDENTIFY_URL = process.env.EXPO_PUBLIC_IDENTIFY_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

/** Long edge in px. Plenty for species-level ID, and keeps uploads to a few hundred KB on a weak connection. */
const MAX_EDGE = 1024;
const TIMEOUT_MS = 30_000;

async function toBase64Jpeg(uri: string): Promise<string> {
  let image = await ImageManipulator.manipulate(uri).renderAsync();
  // Only shrink, never upscale; resize along whichever edge is longer.
  if (Math.max(image.width, image.height) > MAX_EDGE) {
    const context = ImageManipulator.manipulate(uri);
    context.resize(image.width >= image.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
    image = await context.renderAsync();
  }
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!result.base64) throw new IdentifyError("Couldn't prepare the photo for upload.");
  return result.base64;
}

export const cloudIdentifier: Identifier = {
  isAvailable: () => Boolean(IDENTIFY_URL && APP_TOKEN),

  async identify({ photoUri, park, candidates }) {
    if (!IDENTIFY_URL || !APP_TOKEN) {
      throw new IdentifyError(
        "Identification isn't configured — set EXPO_PUBLIC_IDENTIFY_URL and EXPO_PUBLIC_APP_TOKEN (see .env.example)."
      );
    }
    const image = await toBase64Jpeg(photoUri);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(IDENTIFY_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-app-token": APP_TOKEN },
        body: JSON.stringify({
          image,
          park_name: park.name,
          candidates: candidates.map(({ id, common_name, scientific_name }) => ({
            id,
            common_name,
            scientific_name,
          })),
        }),
        signal: controller.signal,
      });
    } catch {
      // fetch only rejects on network failure / abort — i.e. no usable signal.
      throw new OfflineError("No connection to the identification service.");
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429 || res.status === 503) {
      throw new IdentifyError("The identification service is busy — try again in a minute.");
    }
    if (!res.ok) {
      throw new IdentifyError(`Identification failed (HTTP ${res.status}).`);
    }
    const body = (await res.json()) as Omit<IdentifyResponse, "engine">;
    return { ...body, engine: "cloud" };
  },
};

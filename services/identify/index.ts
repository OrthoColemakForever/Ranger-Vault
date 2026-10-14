import { cloudIdentifier } from "./cloud";
import { onDeviceIdentifier } from "./onDevice";
import { IdentifyError, type IdentifyRequest, type IdentifyResponse } from "./types";

export * from "./types";

/**
 * Minimum confidence for a match to count as a catch. Started at 0.6 per
 * spec Section 7. LLM self-reported confidence is NOT calibrated the way a
 * classifier's softmax is — tune this against real field photos (and
 * re-tune whenever the engine or model changes).
 */
export const CONFIDENCE_THRESHOLD = 0.6;

/** Prefers the on-device engine (works offline) and falls back to the cloud. Throws OfflineError when the photo should be queued. */
export async function identify(request: IdentifyRequest): Promise<IdentifyResponse> {
  if (onDeviceIdentifier.isAvailable()) return onDeviceIdentifier.identify(request);
  if (cloudIdentifier.isAvailable()) return cloudIdentifier.identify(request);
  throw new IdentifyError(
    "No identification engine is available — set EXPO_PUBLIC_IDENTIFY_URL and EXPO_PUBLIC_APP_TOKEN (see .env.example)."
  );
}

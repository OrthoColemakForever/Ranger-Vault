/**
 * On-device engine — NOT YET IMPLEMENTED.
 *
 * The plan: an ONNX Runtime React Native or ExecuTorch model (needs an Expo
 * dev build, not Expo Go) fine-tuned on phone photos of each park's species.
 * The old SBUSA-ADS-v1 model is a camera-trap model and would struggle on
 * handheld photos. When a model lands, implement `identify()` here, map its
 * output labels to species ids (Species.model_label exists for exactly this),
 * and flip `isAvailable()` — services/identify/index.ts will start preferring
 * it automatically, offline included.
 */

import { IdentifyError, type Identifier } from "./types";

export const onDeviceIdentifier: Identifier = {
  isAvailable: () => false,
  async identify() {
    throw new IdentifyError("On-device identification isn't implemented yet.");
  },
};

/**
 * RangerVault identification proxy (Cloudflare Worker).
 *
 * The app POSTs a downscaled JPEG plus the current park's candidate species;
 * this worker asks Claude which candidate (if any) is in the photo and returns
 * a small JSON verdict. It exists so the Anthropic API key never ships inside
 * the app bundle. The response shape mirrors the app's IdentifyResponse
 * (services/identify/types.ts) minus the `engine` field, which the app sets.
 */

import Anthropic from "@anthropic-ai/sdk";
import { betaStandardSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/standard-schema";
import { z } from "zod";

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Shared secret the app sends as `x-app-token`. Not real auth — just keeps casual scrapers off the endpoint. */
  APP_TOKEN: string;
  /** Model ID, set in wrangler.toml so it can change without a code edit. */
  MODEL: string;
  /** Workers rate-limit binding (see wrangler.toml); optional so `wrangler dev` works without it. */
  RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

/** ~1024px JPEGs come in well under this; anything bigger is a client bug or abuse. */
const MAX_IMAGE_BASE64_CHARS = 4_000_000;
const MAX_CANDIDATES = 60;

const RequestSchema = z.object({
  /** Base64 JPEG, no `data:` prefix. */
  image: z.string().min(1).max(MAX_IMAGE_BASE64_CHARS),
  park_name: z.string().min(1).max(100),
  candidates: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_]+$/),
        common_name: z.string().max(100),
        scientific_name: z.string().max(100),
      })
    )
    .min(1)
    .max(MAX_CANDIDATES),
});

const SUBJECTS = ["live_animal", "screen_or_print", "toy_or_model", "no_animal"] as const;
/** Sentinel for "none of the candidates" — a plain enum value is friendlier to structured outputs than a nullable union. */
const NONE = "none";

// Frozen and park-agnostic so it stays byte-identical across requests and
// can be prompt-cached; everything request-specific goes in the user turn.
const SYSTEM_PROMPT = `You identify wildlife in photos for RangerVault, a game where visitors to U.S. National Parks "catch" animals by photographing them.

You will receive one photo, the park name, and a list of candidate species for that park. Decide:

1. subject — what the photo actually shows:
   - "live_animal": a real animal photographed directly in the world (including distant, partial, blurry, or nighttime shots).
   - "screen_or_print": the animal appears on a phone/computer/TV screen, a poster, a sign, a book, or a printed photo.
   - "toy_or_model": a plush, figurine, statue, taxidermy mount, or carving.
   - "no_animal": no animal is visible.

2. species_id — the single best-matching candidate id, or "none" if the animal isn't any candidate (e.g. a domestic dog, a bird not on the list) or you can't tell. Only ever pick from the candidate ids. If subject is "no_animal", use "none".

3. confidence — your probability (0 to 1) that species_id is correct. Be calibrated: a clear, close, well-lit view of a distinctive animal can be 0.9+; a distant silhouette that could be either of two similar species should be around 0.5 or lower. Lookalikes matter here (e.g. mule deer vs white-tailed deer, coyote vs gray fox vs domestic dog).

4. top_k — up to 3 candidate ids with their probabilities, best first. May be empty.

5. best_guess_name — a short common name for whatever animal you see, even if it isn't a candidate (e.g. "Domestic dog", "Greater roadrunner"). Empty string if there's no animal.`;

function buildOutputSchema(candidateIds: [string, ...string[]]) {
  const idEnum = z.enum([...candidateIds, NONE] as [string, ...string[]]);
  return z.object({
    subject: z.enum(SUBJECTS),
    species_id: idEnum,
    confidence: z.number(),
    top_k: z.array(z.object({ species_id: idEnum, confidence: z.number() })),
    best_guess_name: z.string(),
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/identify") {
      return json({ error: "not_found" }, 404);
    }
    if (request.headers.get("x-app-token") !== env.APP_TOKEN) {
      return json({ error: "unauthorized" }, 401);
    }
    if (env.RATE_LIMITER) {
      const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: "rate_limited" }, 429);
    }

    let parsedRequest: z.infer<typeof RequestSchema>;
    try {
      parsedRequest = RequestSchema.parse(await request.json());
    } catch {
      return json({ error: "bad_request" }, 400);
    }
    const { image, park_name, candidates } = parsedRequest;

    const candidateIds = candidates.map((c) => c.id) as [string, ...string[]];
    const OutputSchema = buildOutputSchema(candidateIds);
    const candidateList = candidates
      .map((c) => `- ${c.id}: ${c.common_name} (${c.scientific_name})`)
      .join("\n");

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    let message;
    try {
      message = await client.beta.messages.parse({
        model: env.MODEL,
        max_tokens: 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: {
          effort: "low",
          format: betaStandardSchemaOutputFormat(OutputSchema),
        },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
              {
                type: "text",
                text: `Park: ${park_name}\n\nCandidate species:\n${candidateList}`,
              },
            ],
          },
        ],
      });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: "upstream_busy" }, 503);
      if (err instanceof Anthropic.BadRequestError) {
        console.error("Anthropic 400:", err.message);
        return json({ error: "bad_image" }, 400);
      }
      if (err instanceof Anthropic.APIError) {
        console.error(`Anthropic ${err.status}:`, err.message);
        return json({ error: "upstream_error" }, 502);
      }
      throw err;
    }

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      console.error("No usable output; stop_reason =", message.stop_reason);
      return json({ error: "no_result" }, 502);
    }

    const out = message.parsed_output;
    const toId = (id: string) => (id === NONE ? null : id);
    return json({
      subject: out.subject,
      species_id: out.subject === "no_animal" ? null : toId(out.species_id),
      confidence: clamp01(out.confidence),
      top_k: out.top_k
        .filter((e) => e.species_id !== NONE)
        .slice(0, 3)
        .map((e) => ({ species_id: e.species_id, confidence: clamp01(e.confidence) })),
      best_guess_name: out.best_guess_name || undefined,
    });
  },
};

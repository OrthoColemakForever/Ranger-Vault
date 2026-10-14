# RangerVault identification proxy

A Cloudflare Worker that sits between the app and the Claude API, so the
Anthropic API key never ships inside the app. The app (`services/identify/cloud.ts`)
POSTs a downscaled JPEG plus the current park's species list to `/identify`;
the worker asks Claude which candidate (if any) is in the photo and whether
it's a live animal (vs. a screen, print, or toy), and returns JSON.

## Run locally

```sh
npm install
cp .dev.vars.example .dev.vars   # fill in ANTHROPIC_API_KEY and an APP_TOKEN
npm run dev                      # http://localhost:8787/identify
```

Point the app at it in `../.env`:

```
EXPO_PUBLIC_IDENTIFY_URL=http://localhost:8787/identify   # simulator
# EXPO_PUBLIC_IDENTIFY_URL=http://<your-mac-LAN-IP>:8787/identify   # physical phone
EXPO_PUBLIC_APP_TOKEN=<same APP_TOKEN>
```

Quick test without the app:

```sh
IMG=$(base64 -i some-coyote.jpg | tr -d '\n')
curl -s -X POST localhost:8787/identify \
  -H 'x-app-token: <APP_TOKEN>' -H 'content-type: application/json' \
  -d "{\"image\":\"$IMG\",\"park_name\":\"Big Bend\",\"candidates\":[{\"id\":\"coyote\",\"common_name\":\"Coyote\",\"scientific_name\":\"Canis latrans\"},{\"id\":\"gray_fox\",\"common_name\":\"Gray Fox\",\"scientific_name\":\"Urocyon cinereoargenteus\"}]}"
```

## Deploy

```sh
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put APP_TOKEN
npm run deploy
```

Then set `EXPO_PUBLIC_IDENTIFY_URL` to `https://rangervault-identify.<your-subdomain>.workers.dev/identify`.

## Tuning

- **Model**: `MODEL` in `wrangler.toml` (default `claude-opus-5-5`). `claude-haiku-5-5`
  is far cheaper per identification; worth comparing accuracy on real field
  photos, especially lookalikes (mule vs. white-tailed deer, coyote vs. gray fox).
- **Rate limit**: 20 requests/minute per IP (`[[ratelimits]]` in `wrangler.toml`).
- **App token** is not real authentication — it's compiled into the app.
  Before a public launch, add App Attest / Play Integrity or user accounts.

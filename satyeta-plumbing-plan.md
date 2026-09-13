# satyeta-plumbing-plan.md — Plumbing + Safety (Satyeta's Work)

## Top-Level Overview

Satyeta owns the server-side plumbing and safety layer for the Setu app. This plan covers:
1. The five API endpoint implementations
2. The watsonx Llama client (`lib/watsonx/llama.ts`) — Bob task
3. The Watson STT backup client + auto-switch logic — Bob task
4. Guard wiring (OTP blocker, reference-number detector, redaction)
5. ISL avatar asset vendoring into `public/isl/`

The build order from `AGENTS.md` is respected: endpoints first, then Llama (step 6), then guards (step 7), then Watson STT fallback (step 8), then gloss (step 9). The stretch Exotel integration is excluded unless steps 1–12 are green.

**Definition of done (per TEAM_GUIDE.md):** each endpoint has a working curl example; guard has unit tests for "OTP is 482911" (blocked) and "complaint number COMP-4821" (detected); killing the ElevenLabs key mid-session flips captions to Watson without a reload.

---

## Sub-Task 1 — `/api/scribe-token` endpoint

**Intent:** Exchange the server-side `ELEVENLABS_API_KEY` for a short-lived ElevenLabs Scribe token and return it to the browser. The API key must never be exposed to the client.

**Expected Outcomes:**
- `POST /api/scribe-token` returns `{ token: "..." }` with a short-lived value.
- Curl: `curl -X POST http://localhost:3000/api/scribe-token` → `{"token":"..."}`.
- If the API key is missing, returns `500`.

**Todo List:**
1. In `app/api/scribe-token/route.ts`, read `ELEVENLABS_API_KEY` from `process.env`.
2. Call the ElevenLabs signed-URL / token endpoint (REST) to get a short-lived token.
3. Return `NextResponse.json({ token })`.
4. Return `500` with a clear message if the env var is absent.

**Relevant Context:**
- File: [`app/api/scribe-token/route.ts`](app/api/scribe-token/route.ts) — currently returns 501.
- Env var: `ELEVENLABS_API_KEY` (`.env.local`).
- ElevenLabs token endpoint: `POST https://api.elevenlabs.io/v1/convai/conversation/token` with `xi-api-key` header.

**Status:** [ ] pending

---

## Sub-Task 2 — `/api/tts` endpoint with streaming + barge-in

**Intent:** Server proxy that streams ElevenLabs TTS audio to the browser. Must support immediate cancellation (barge-in) so that when the user unmutes and speaks, the in-progress TTS can be cut off.

**Expected Outcomes:**
- `POST /api/tts` with `{ text, lang }` streams audio chunks back.
- Client can abort the fetch (using `AbortController`) to cancel mid-stream.
- Curl: `curl -X POST http://localhost:3000/api/tts -H "Content-Type: application/json" -d '{"text":"Hello","lang":"en"}' --output test.mp3`.
- Model: `eleven_flash_v2_5`; single voice ID for both hi and en.

**Todo List:**
1. In `app/api/tts/route.ts`, parse `{ text, lang }` from request body.
2. Fetch ElevenLabs TTS streaming endpoint with `ELEVENLABS_API_KEY` and model `eleven_flash_v2_5`.
3. Pipe the response body as a `ReadableStream` using `new Response(stream, { headers: { "Content-Type": "audio/mpeg" } })`.
4. Honour request cancellation: abort the upstream fetch when the incoming request aborts.
5. Also implement `streamTTS()` in `lib/elevenlabs/tts.ts` to call `/api/tts` from the browser with an `AbortController` and return a cancel function.

**Relevant Context:**
- File: [`app/api/tts/route.ts`](app/api/tts/route.ts) — stub.
- File: [`lib/elevenlabs/tts.ts`](lib/elevenlabs/tts.ts) — stub `streamTTS()`.
- ElevenLabs streaming endpoint: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`.
- Barge-in requirement in `AGENTS.md`: "any playing TTS is cancelled instantly".
- `AudioTransport.speak()` in [`lib/transport/AudioTransport.ts`](lib/transport/AudioTransport.ts) must return a cancel function.

**Status:** [ ] pending

---

## Sub-Task 3 — `/api/suggest` endpoint + watsonx Llama client (Bob Task)

**Intent:** Implement the Llama 3.3 70B Instruct reply-suggestion pipeline on IBM watsonx.ai. This is one of the two IBM Bob tasks assigned to Satyeta. The `suggest()` function in `lib/watsonx/llama.ts` calls the model and the API route wires it up.

**Expected Outcomes:**
- `POST /api/suggest` with `{ caption, history, facts, goal, callLanguage }` returns `{ suggestions: [...] }` with 3–5 items.
- Each suggestion: `{ id, label (UI language), sentence (call language) }`.
- Temperature ~0.2; JSON only (no prose around the JSON).
- `extractFacts()` also implemented (used for reference number extraction from captions).
- Curl: `curl -X POST http://localhost:3000/api/suggest -H "Content-Type: application/json" -d '{"caption":"Your consumer number please","history":[],"facts":{"consumer_number":"1234567890"},"goal":"Get complaint number","callLanguage":"hi"}' → {"suggestions":[...]}`.

**Todo List:**
1. Implement `suggest()` in `lib/watsonx/llama.ts`:
   - Build a system prompt: role = relay assistant for deaf user; language rules; use only provided facts; JSON-only output.
   - Build user message: current caption + last N history entries + facts + goal + callLanguage.
   - Always include the 4 always-present suggestions (Wait / Please repeat / I did not understand / Please give the complaint number) if LLM count < 3.
   - Call watsonx `/ml/v1/text/generation` REST endpoint with `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`, model `meta-llama/llama-3-3-70b-instruct`.
   - Parse JSON response and return `Suggestion[]`.
2. Implement `extractFacts()` in `lib/watsonx/llama.ts` similarly — prompt asks for JSON key-value pairs from text.
3. In `app/api/suggest/route.ts`, parse body, call `suggest()`, return `NextResponse.json({ suggestions })`.
4. Handle errors: if watsonx returns an error, return `{ suggestions: [] }` with always-present fallback set.
5. Commit with `bob: watsonx client + suggestion prompt` prefix after Bob session.

**Relevant Context:**
- File: [`lib/watsonx/llama.ts`](lib/watsonx/llama.ts) — stubs for `suggest()`, `extractFacts()`, `gloss()`.
- File: [`app/api/suggest/route.ts`](app/api/suggest/route.ts) — stub.
- Env vars: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`, `WATSONX_MODEL`.
- JSON shape for suggestions in `AGENTS.md` "JSON shapes" section.
- Always-present suggestions: "Wait / Please repeat / I did not understand / Please give the complaint number" (AGENTS.md).
- Types: [`lib/types.ts`](lib/types.ts) — `TranscriptEntry`, `Suggestion`.

**Status:** [ ] pending

---

## Sub-Task 4 — Guard wiring: OTP blocker + reference-number detector + redact

**Intent:** Wire the already-implemented guard utility functions into the actual Send flow and caption processing pipeline. Add unit tests to satisfy the definition-of-done.

**Expected Outcomes:**
- Sending a suggestion containing "OTP is 482911" is blocked; UI shows "Setu will not speak codes. Unmute to say it yourself."
- A caption containing "complaint number COMP-4821" triggers a pin confirmation banner.
- Stored transcript entries have digits redacted when triggered.
- Unit tests: `containsSensitiveCode("OTP is 482911")` → `true`; `detectReferenceNumbers("complaint number COMP-4821")` → `["COMP-4821"]`.

**Todo List:**
1. Create `lib/guard/__tests__/guard.test.ts` (or `.spec.ts`) with unit tests for `containsSensitiveCode` and `detectReferenceNumbers`.
2. Wire `containsSensitiveCode` into the Send flow: before calling `/api/tts`, check the sentence and block if true — show the blocking message in the UI (this may touch `app/call/page.tsx` or the `ReplySuggestions` component).
3. Wire `detectReferenceNumbers` into the caption feed: after each final caption, run the detector and if a number is found show the "Heard X — pin this?" banner.
4. Wire `redact` into transcript persistence: before saving a `TranscriptEntry` to the store, run `redact()` on its text and set `redacted: true` if changed.

**Relevant Context:**
- Files: [`lib/guard/otp.ts`](lib/guard/otp.ts), [`lib/guard/refnum.ts`](lib/guard/refnum.ts), [`lib/guard/redact.ts`](lib/guard/redact.ts) — logic already implemented, just not wired.
- File: [`lib/store/index.ts`](lib/store/index.ts) — transcript persistence.
- File: [`app/call/page.tsx`](app/call/page.tsx) — live call screen where Send and caption feed live.
- Rule from `AGENTS.md`: "OTP/PIN guard. Setu never speaks OTP…"

**Status:** [ ] pending

---

## Sub-Task 5 — Watson STT backup client + auto-switch (Bob Task)

**Intent:** Implement `WatsonSTTClient` and `createSTTWithFallback()` so that if ElevenLabs Scribe returns a quota/credit error, captions silently switch to Watson STT without a reload. This is the second IBM Bob task for Satyeta.

**Expected Outcomes:**
- `WatsonSTTClient.connect()` proxies audio through `WS /api/stt-fallback` and emits captions via the same `CaptionCallback` shape as ScribeClient.
- `createSTTWithFallback()` starts with Scribe; on a quota/credit error event it disconnects Scribe, connects Watson, and shows a "backup captions" note in the UI — no page reload.
- `/api/stt-fallback` route upgraded to accept WebSocket and proxy to IBM Watson STT streaming API.
- Killing the ElevenLabs key mid-session triggers the switch.
- Commit with `bob: watson stt fallback` prefix after Bob session.

**Todo List:**
1. Implement `WatsonSTTClient.connect()` in `lib/watson-stt/client.ts`:
   - Open a WebSocket to `/api/stt-fallback`.
   - On message, parse the Watson STT response and call `onCaption(text, isFinal)`.
   - `disconnect()` closes the socket.
2. Implement `createSTTWithFallback()` in `lib/watson-stt/autoswitch.ts`:
   - Try `ScribeClient.connect()` first.
   - Listen for the quota/credit error (error event with code or message containing "quota" / "credit").
   - On error: call `ScribeClient.disconnect()`, call `WatsonSTTClient.connect()`, emit a `"backup"` status event so the UI can show the banner.
3. Implement `/api/stt-fallback` WebSocket route in `app/api/stt-fallback/route.ts`:
   - Upgrade the HTTP connection to WebSocket.
   - Connect to IBM Watson STT WebSocket endpoint using `WATSON_STT_API_KEY` + `WATSON_STT_URL`.
   - Model: `hi-IN_Telephony` or `en-IN_Telephony` based on `callLanguage`.
   - Proxy audio frames → Watson; Watson transcript events → client.
   - Note: Next.js App Router does not natively support WebSocket upgrades — may need a custom server or edge runtime approach.

**Relevant Context:**
- Files: [`lib/watson-stt/client.ts`](lib/watson-stt/client.ts), [`lib/watson-stt/autoswitch.ts`](lib/watson-stt/autoswitch.ts) — stubs.
- File: [`app/api/stt-fallback/route.ts`](app/api/stt-fallback/route.ts) — stub with note about WebSocket limitations.
- File: [`lib/elevenlabs/scribe.ts`](lib/elevenlabs/scribe.ts) — ScribeClient to integrate with.
- Env vars: `WATSON_STT_API_KEY`, `WATSON_STT_URL`.
- Watson STT models: `hi-IN_Telephony`, `en-IN_Telephony`.

**Status:** [ ] pending

---

## Sub-Task 6 — `/api/gloss` endpoint + `gloss()` in watsonx client

**Intent:** Implement the ISL gloss generation pipeline — convert spoken text into an array of English uppercase words that the CWASA SiGML player can use to drive the ISL avatar animation.

**Expected Outcomes:**
- `POST /api/gloss` with `{ text }` returns `{ gloss: ["MORNING", "POWER", "CUT"] }`.
- Unknown words are represented as fingerspelling (letter-by-letter).
- Curl: `curl -X POST http://localhost:3000/api/gloss -H "Content-Type: application/json" -d '{"text":"Good morning"}' → {"gloss":["MORNING"]}`.

**Todo List:**
1. Implement `gloss()` in `lib/watsonx/llama.ts`:
   - Prompt asks Llama to convert the input text into a JSON array of English uppercase ISL gloss words.
   - Unknown words: output each letter as a separate item (e.g., `"COMP-4821"` → `["C","O","M","P","4","8","2","1"]`).
   - Return `string[]`.
2. In `app/api/gloss/route.ts`, parse `{ text }`, call `gloss()`, return `NextResponse.json({ gloss })`.

**Relevant Context:**
- File: [`lib/watsonx/llama.ts`](lib/watsonx/llama.ts) — `gloss()` stub.
- File: [`app/api/gloss/route.ts`](app/api/gloss/route.ts) — stub.
- ISL avatar player in `public/isl/` (assets to be vendored in sub-task 7).
- AGENTS.md: "Unknown words fingerspell; credit the repo in README."

**Status:** [ ] pending

---

## Sub-Task 7 — ISL avatar asset vendoring

**Intent:** Pull the CWASA SiGML player and sign files from `github.com/shoebham/text_to_isl` into `public/isl/` so the ISL avatar can boot and play one test sentence without any external network call.

**Expected Outcomes:**
- `public/isl/` contains the CWASA player JS/CSS and at least one SiGML file for a test sentence.
- The `ISLAvatar` component can load and play one test sentence in the browser.
- README credits `github.com/shoebham/text_to_isl`.

**Todo List:**
1. Download the CWASA player JS bundle and CSS from the referenced repo into `public/isl/`.
2. Download a sample set of SiGML sign files into `public/isl/signs/`.
3. Update [`components/ISLAvatar.tsx`](components/ISLAvatar.tsx) to load the player from `/isl/` (relative path, no CDN).
4. Add a credit line to the project `README.md` (or create one): "ISL avatar uses CWASA SiGML player from github.com/shoebham/text_to_isl".

**Relevant Context:**
- Directory: `public/isl/` — has only `.gitkeep` currently.
- File: [`components/ISLAvatar.tsx`](components/ISLAvatar.tsx) — avatar component.
- AGENTS.md: "ISL avatar vendoring: CWASA player + SiGML files into `public/isl/`, one test sentence".

**Status:** [ ] pending

---

## Notes for Implementation

- All Bob-tagged sub-tasks (3 and 5) must be done with IBM Bob, with the session screenshot saved in `docs/bob-log/` and committed with the `bob:` prefix.
- Never expose `ELEVENLABS_API_KEY`, `WATSONX_API_KEY`, or `WATSON_STT_API_KEY` to the browser — all external API calls go through the Next.js API routes.
- Sub-tasks can be worked roughly in order (1 → 2 → 3 → 4 → 5 → 6 → 7) to respect the build order in `AGENTS.md`.
- WebSocket support in Next.js App Router is limited — sub-task 5 may need a custom server entry point; investigate before implementing.

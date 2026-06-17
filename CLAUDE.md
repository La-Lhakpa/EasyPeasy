# EasyPeasy — Project Context for Claude Code

> Voice-first English-learning web app for South Asian immigrant homemakers with low digital literacy. Teaches practical, survival English through familiar daily activities. The flagship feature is **Cook & Converse**: the user cooks a familiar recipe while an AI voice companion named **NaanSense** keeps them company and helps them practice speaking.

## What EasyPeasy is

A **web-based** (Vite + React frontend, Node/Express backend) voice-first English learning app.

**Target user:** South Asian immigrant homemakers learning survival English.

**Flagship feature:** Cook & Converse — hold-to-talk voice practice while cooking.

## The prime directive for Cook & Converse

**The goal is to make the user speak, not to finish the recipe.** The recipe is only an excuse to talk. Success = the user talking out loud, trying words, and feeling safe and encouraged. Never rush toward the last step. Never treat steps as a checklist.

Core behaviors NaanSense must follow:
- Encourage speaking; invite the user to talk every turn, then listen.
- Pronunciation help by gentle modeling (recast), never correction. Never say "wrong" or "incorrect". Praise the attempt, model the word correctly, optionally invite a retry.
- Warm, specific encouragement. Emotional safety over accuracy. No shame, no rush.
- Bilingual bridge: may use the user's first language briefly to comfort, then return to English.

The complete behavior spec is in `naansense_system_prompt.md`.

## Key files

- `frontend/src/prompts/naansense_system_prompt.md` — NaanSense's full system prompt (its behavior).
  Goes into Groq Llama's system message. Has placeholders (`{native_language}`, `{recipe_name}`, 
  `{current_step_instruction}`, `{step_number}`, `{total_steps}`) filled at session start.
- `frontend/src/data/easypeasy_recipes.json` — 60 recipes (30 Nepali, 30 Bengali). Static content.
  Each recipe has `name`, `description`, `cuisine`, `tags`, and `steps[]`, where each step has 
  `instruction` and encouraging `phrase`.

## Architecture decisions

1. **Recipe search:** Static JSON bundled in the app. Searched locally (no AI calls). Works offline.

2. **Voice pipeline (Cook & Converse):** 
   - **STT:** Groq Whisper (free tier, on backend)
   - **Chat:** Groq Llama 3.3 70B (free tier) with NaanSense system prompt
   - **TTS:** Sarvam AI `bulbul:v3` (free tier, South Asian voice: Anushka, en-IN)
   - **Fallback TTS:** Google Translate TTS (free, en-IN)
   - **Final fallback:** Browser `speechSynthesis` (en-IN)

3. **Session management:** One conversation = one NaanSense session. System prompt + recipe are static.
   Each turn sends only the current step pointer + last 8 messages, never the whole transcript.

4. **API key security:** All keys stay on the Node backend. Frontend sends only audio.

5. **User controls pace:** No auto-advance. User taps "next step" button. NaanSense lingers on current step.

6. **Auth (for now):** Simple `localStorage` flag (`easypeasy:signedIn`). On first launch, user sees Welcome.
   No backend auth yet.

## Frontend stack

- **Framework:** React 19 + React Router 7
- **Build:** Vite
- **Styling:** CSS (global.css) with South Asian aesthetic (floral borders, warm colors)
- **Audio:** Web MediaRecorder API (hold-to-talk)
- **Voice playback:** HTML5 Audio + browser `speechSynthesis` fallback

## Backend stack

- **Runtime:** Node.js
- **Framework:** Express
- **Key dependencies:** Groq SDK, Sarvam SDK, dotenv, CORS
- **APIs:**
  - `POST /api/cook` — full voice turn (STT → NaanSense chat → TTS)
  - `POST /api/recipes/search` — search static recipes (Gemini, optional)
  - `POST /api/naansense` — text chat with NaanSense (Gemini, optional)
  - `POST /api/tts` — text-to-speech (ElevenLabs, optional)
  - `GET /api/health` — health check

## Environment variables

```
# Required for Cook & Converse voice
GROQ_API_KEY=              # Free from console.groq.com
SARVAM_API_KEY=            # Free from app.sarvam.ai

# Optional (disable recipe search / text chat if missing)
GEMINI_API_KEY=            # Free from aistudio.google.com/apikey

# Optional (premium voice if configured)
ELEVENLABS_API_KEY=        # Premium TTS (not used in MVP)
ELEVENLABS_VOICE_ID=

# Server
PORT=8787
```

## Screens built

- **Welcome** — intro + "Start Learning Free" CTA
- **Sign In** — Login / Sign Up buttons (auth gate)
- **Home** — greeting + bottom nav (Home, Chat, Settings, Profile)
- **Cooking Hub** — recipe gallery
- **Cook & Converse** — hold-to-talk with NaanSense (live)
- **Daily Life Hub** — scenarios (Grocery, Doctor, School, etc.)
- **Phrase Bank** — common phrases by scenario
- **Word Bank** — vocabulary with audio pronunciation
- **Profile** — user settings, language, help, about
- **About Us** — mission statement

## Design system

- **Colors:** Warm cream/beige background, green & red accents, South Asian florals
- **Typography:** Accessible font sizes (min 16px), high contrast
- **Layout:** Mobile-first, 48dp+ touch targets, audio-first
- **Floral borders:** Top + side decorative elements (lotus, flowers)

## Next steps

- [ ] Test Cook & Converse end-to-end with all 60 recipes
- [ ] Tune NaanSense behavior: test silent user, code-switching, mispronunciation, off-topic
- [ ] Add recipe illustrations (currently placeholder)
- [ ] Implement real auth (Supabase or similar)
- [ ] Add progress tracking + user data persistence
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Offline support for emergency phrases

## Conventions / guardrails

- **NaanSense turns:** 1–2 sentences max (spoken aloud)
- **Emotional safety over accuracy**
- **Never shame, never rush, never correct harshly**
- **Bilingual bridge (native language) only to lower fear**
- **Celebration of attempt > accuracy**

# EasyPeasy

**Learn survival English by cooking the food you already love — with a warm AI voice companion.**

## Description

Most English apps assume you can read, type, and sit through lessons. EasyPeasy doesn't. It's a voice-first web app built for South Asian immigrant homemakers with low digital literacy who want to practice **spoken** English through familiar daily activities.

The flagship feature is **Cook & Converse**: you pick a recipe you already know — *dal bhat*, *macher jhol*, *momo* — and cook it while an AI companion named **NaanSense** keeps you company and gently helps you speak. The recipe is just an excuse to talk. The goal is never to finish the dish; it's to get you talking out loud, trying words, and feeling safe doing it.

## Features

- **Hold-to-talk voice conversation** — press, speak, release. No typing, no reading required.
- **Cook & Converse** — practice English step-by-step while making one of 60 familiar Nepali and Bengali recipes.
- **NaanSense, a patient AI companion** — encourages every attempt, models correct pronunciation gently (never says "wrong"), and switches to your first language briefly when you need comfort.
- **You set the pace** — no auto-advance and no checklist. NaanSense lingers on a step as long as you like.
- **Daily Life scenarios** — practice for the grocery store, doctor's office, pharmacy, transportation, parent–teacher meetings, and emergencies.
- **Phrase Bank & Word Bank** — common phrases and vocabulary grouped by situation, each with audio pronunciation.

## Cook & Converse — how it works

Each spoken turn runs through a fully **free-tier** voice pipeline on the backend, so no API keys are ever exposed to the browser:

1. **Speech-to-text** — Groq Whisper transcribes your audio.
2. **Conversation** — Groq Llama 3.3 70B replies as NaanSense, using a behavior spec tuned for emotional safety.
3. **Text-to-speech** — Sarvam AI (`bulbul:v3`, a South Asian `en-IN` voice) speaks the reply, with Google Translate TTS and the browser's built-in speech synthesis as fallbacks.

Recipes are bundled as static JSON and searched locally, so browsing recipes works offline.

## Quick Start

You'll run two processes: the **backend** (Express, port `8787`) and the **frontend** (Vite, port `5173`).

```bash
# 1. Clone
git clone https://github.com/La-Lhakpa/EasyPeasy.git
cd EasyPeasy

# 2. Start the backend
cd backend
npm install
cp .env.example .env        # then add your keys (see below)
npm run dev                 # http://localhost:8787

# 3. In a second terminal, start the frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**, sign in (a simple local flag — no real account needed), and head to the Cooking Hub to start a Cook & Converse session.

> **Note:** The frontend talks to the backend at `http://localhost:8787`, hardcoded in [frontend/src/lib/api.js](frontend/src/lib/api.js). If you run the backend elsewhere, update `API_BASE` there.

You need a microphone and a Chromium-based browser (the app uses the Web `MediaRecorder` API for hold-to-talk).

## Project Structure

```
EasyPeasy/
├── backend/                      # Node + Express API server
│   ├── server.js                 # All routes + voice pipeline
│   └── .env.example              # API keys template
├── frontend/                     # React 19 + Vite web app
│   ├── src/
│   │   ├── pages/                # Screens (Welcome, CookingHub, CookingConversation, ...)
│   │   ├── components/           # Reusable UI (RecipeCard, BottomNavigation, ...)
│   │   ├── routes/AppRoutes.jsx  # React Router setup
│   │   ├── lib/api.js            # Backend API calls
│   │   ├── data/                 # Static JSON: 60 recipes, phrases, word bank, scenarios
│   │   ├── prompts/              # naansense_system_prompt.md (NaanSense's behavior)
│   │   └── styles/global.css     # South Asian aesthetic (warm tones, floral borders)
│   └── public/recipe-images/     # Recipe photos
└── CLAUDE.md                     # Detailed project context
```

## Tech Stack

- **Frontend:** React 19, React Router 7, Vite 7, Lucide icons, plain CSS
- **Backend:** Node.js (ES modules), Express 4
- **Speech-to-text:** Groq Whisper
- **Conversation:** Groq Llama 3.3 70B
- **Text-to-speech:** Sarvam AI `bulbul:v3` → Google Translate TTS → browser `speechSynthesis` (fallback chain)
- **Audio capture:** Web `MediaRecorder` API
- **Recipe search / text chat:** Google Gemini (optional)

### Backend API

| Method | Route                  | Purpose                                        |
| ------ | ---------------------- | ---------------------------------------------- |
| `POST` | `/api/cook`            | Full voice turn: STT → NaanSense chat → TTS    |
| `POST` | `/api/recipes/search`  | Search recipes (Gemini, optional)              |
| `POST` | `/api/naansense`       | Text chat with NaanSense (Gemini, optional)    |
| `POST` | `/api/tts`             | Text-to-speech                                 |
| `GET`  | `/api/health`          | Health check                                   |

## Roadmap

- [ ] Test Cook & Converse end-to-end across all 60 recipes
- [ ] Real authentication and user data persistence (currently a `localStorage` flag)
- [ ] Progress tracking across recipes and scenarios
- [ ] Recipe illustrations for every dish
- [ ] Offline support for emergency phrases
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Multi-language bridge expansion (Hindi, Nepali, Bengali)


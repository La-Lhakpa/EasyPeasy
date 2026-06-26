import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Groq, { toFile } from "groq-sdk";

const PORT = process.env.PORT || 8787;
const MODEL = "gemini-2.0-flash-lite";
const API_KEY = process.env.GEMINI_API_KEY;

// const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID;
// const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

const GROQ_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;
const GROQ_STT_MODEL = "whisper-large-v3-turbo";
const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";

const SARVAM_KEY = process.env.SARVAM_API_KEY;
const SARVAM_VOICE = "anushka";
const SARVAM_MODEL = "bulbul:v2"; // "anushka" voice is only available on bulbul:v2, not v3

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAANSENSE_FALLBACK =
  "You are NaanSense, a warm, patient voice companion who helps a beginner practice spoken " +
  "English while cooking {recipe_name}. The current step is \"{current_step_instruction}\" " +
  "(step {step_number} of {total_steps}). Their first language is {native_language}. Reply in " +
  "one or two short, kind spoken sentences. Never say \"wrong\" or \"incorrect\"; gently model " +
  "good English and invite them to speak again. Never rush the recipe — the goal is to make " +
  "them speak and feel safe.";

const NAANSENSE_TEMPLATE = (() => {
  try {
    const raw = readFileSync(
      resolve(__dirname, "../frontend/src/prompts/naansense_system_prompt.md"),
      "utf8"
    );
    const start = raw.indexOf("## Who you are");
    return start === -1 ? raw : raw.slice(start);
  } catch (err) {
    console.warn("Could not load naansense_system_prompt.md, using fallback:", err.message);
    return NAANSENSE_FALLBACK;
  }
})();

const NAANSENSE_SYSTEM = `You are NaanSense, a warm and patient English-speaking tutor inside a
cooking-practice app. The learner is a beginner English speaker cooking a recipe at home.

Your job:
- Have a friendly back-and-forth about what the learner is cooking, step by step.
- Ask short, simple questions like "What are you doing now?" or "What comes next?".
- When the learner's English has a small mistake, gently model the correct sentence:
  praise them, then say the natural version ("You can say: 'I am cutting the onions.'").
- Encourage them to say the phrase out loud.
- Stay tied to the specific recipe and its steps that you are given.

Style rules (important — your replies are read aloud by a voice):
- Reply in 1-3 short sentences. No markdown, no lists, no emoji.
- Use simple, everyday words. Be warm and encouraging.`;

if (!API_KEY) {
  console.warn(
    "GEMINI_API_KEY not set — recipe search and /api/naansense are disabled. " +
      "Add a free key from https://aistudio.google.com/apikey to enable them."
  );
}

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function geminiGenerate({ system, contents, generationConfig }) {
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents,
    generation_config: generationConfig,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.post("/api/recipes/search", async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "Recipe search is not configured (missing GEMINI_API_KEY)." });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: "No search query provided." });

  try {
    const reply = await geminiGenerate({
      system: "You are a helpful recipe finder. Search results should be JSON with name, description, ingredients, and steps.",
      contents: [{ role: "user", parts: [{ text: `Find a recipe for: ${query}` }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

    const data = JSON.parse(reply);
    res.json({
      name: data.name || query,
      description: data.description || "",
      ingredients: data.ingredients || [],
      steps: data.steps || [],
    });
  } catch (err) {
    console.error("recipe search failed:", err.message);
    res.status(502).json({ error: "Could not create a recipe right now. Please try again." });
  }
});

app.post("/api/naansense", async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "NaanSense text chat is not configured (missing GEMINI_API_KEY)." });

  const { recipe, messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No conversation provided." });
  }

  const stepLines = Array.isArray(recipe?.steps)
    ? recipe.steps.map((s, i) => `${i + 1}. ${s.instruction} (practice: "${s.phrase}")`).join("\n")
    : "(no steps provided)";

  const system = `${NAANSENSE_SYSTEM}

The learner is cooking: ${recipe?.name || "a dish"}.
The recipe steps are:
${stepLines}`;

  const contents = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  try {
    const reply = await geminiGenerate({
      system,
      contents,
      generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
    });
    res.json({ reply });
  } catch (err) {
    console.error("naansense chat failed:", err.message);
    res.status(502).json({ error: "NaanSense is having trouble right now. Please try again." });
  }
});

// Standalone "Hear It" voice: speaks any phrase aloud using the same
// Sarvam (Indian-accent) → Google fallback chain as the cooking conversation.
// Returns base64 MP3 so the frontend can play it; on failure the frontend
// gracefully falls back to the browser's built-in speech synthesis.
app.post("/api/tts", async (req, res) => {
  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "No text to speak." });

  try {
    const audioBase64 = (await sarvamTts(text)) ?? (await googleTts(text, "en-IN"));
    if (!audioBase64) {
      return res.status(503).json({ error: "Voice unavailable. Falling back to browser speech." });
    }
    res.json({ audioBase64 });
  } catch (err) {
    console.error("tts error:", err.message);
    res.status(502).json({ error: "Voice generation failed." });
  }
});

const CULINARY_GLOSSARY = {
  turmeric: "हल्दी", mustard: "सरसों", ginger: "अदरक", dal: "दाल",
  cumin: "जीरा", coriander: "धनिया", coconut: "नारियल", masala: "मसाला",
  garlic: "लहसुन", chenna: "छेना", aloo: "आलू", cardamom: "इलायची",
  momo: "मोमो", dum: "दम", sesame: "तिल", achar: "आचार", luchi: "लुची",
  roti: "रोटी", ghee: "घी", jaggery: "गुड़", gundruk: "गुन्ड्रुक",
  sadeko: "सदेको", chana: "चना", begun: "बेगुन", tama: "तामा",
  yomari: "योमारी", kheer: "खीर", sandesh: "सन्देश", rasgulla: "रसगुल्ला",
  labra: "लब्रा", jeera: "जीरा", haldi: "हल्दी", thukpa: "थुक्पा",
};

function transliterateIndic(text) {
  let result = text;
  // Case-insensitive word-boundary replacement
  for (const [romanized, devanagari] of Object.entries(CULINARY_GLOSSARY)) {
    const regex = new RegExp(`\\b${romanized}\\b`, "gi");
    result = result.replace(regex, devanagari);
  }
  return result;
}

async function sarvamTts(text) {
  if (!SARVAM_KEY || !text?.trim()) return null;
  try {
    const trimmed = text.trim();
    const transliterated = transliterateIndic(trimmed);
    const hasDevangari = /[ऀ-ॿ]/.test(transliterated);

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SARVAM_KEY}`,
      },
      body: JSON.stringify({
        text: transliterated,
        target_language_code: hasDevangari ? "hi-IN" : "en-IN",
        speaker: SARVAM_VOICE,
        model: SARVAM_MODEL,
        pace: 0.9,
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("sarvam tts failed:", res.status, err);
      return null;
    }

    const data = await res.json();
    return data.audios?.[0] || null;
  } catch (err) {
    console.warn("sarvam tts error, falling back to google tts:", err.message);
    return null;
  }
}

function chunkForTts(text, max = 180) {
  const chunks = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && (current + " " + word).length > max) {
      chunks.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

async function googleTts(text, lang = "en") {
  const clean = (text || "").trim();
  if (!clean) return null;
  try {
    const parts = [];
    for (const chunk of chunkForTts(clean)) {
      const url =
        "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob" +
        `&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(chunk)}`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) throw new Error(`google tts ${r.status}`);
      parts.push(Buffer.from(await r.arrayBuffer()));
    }
    return Buffer.concat(parts).toString("base64");
  } catch (err) {
    console.warn("google tts failed, frontend will use browser voice:", err.message);
    return null;
  }
}

function buildNaanSenseSystem({ recipe, stepIndex = 0, nativeLanguage } = {}) {
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  const total = steps.length;
  const index = Math.min(Math.max(Number(stepIndex) || 0, 0), Math.max(total - 1, 0));
  const step = steps[index];

  const fills = {
    native_language: nativeLanguage || "their first language",
    recipe_name: recipe?.name || "a dish",
    current_step_instruction: step?.instruction || "getting started together",
    step_number: String(index + 1),
    total_steps: String(total || 1),
  };

  return NAANSENSE_TEMPLATE.replace(/\{(\w+)\}/g, (m, key) => (key in fills ? fills[key] : m));
}

app.post("/api/cook", async (req, res) => {
  if (!groq) {
    return res.status(503).json({ error: "Voice is not configured (missing GROQ_API_KEY)." });
  }

  const { audio, mimeType, recipe, stepIndex, messages, nativeLanguage } = req.body || {};
  if (!audio) return res.status(400).json({ error: "No audio received." });

  try {
    const buf = Buffer.from(audio, "base64");
    const type = typeof mimeType === "string" && mimeType ? mimeType : "audio/webm";

    let ext = "wav";
    if (type.includes("webm")) ext = "webm";
    else if (type.includes("mp4") || type.includes("mpeg4")) ext = "mp4";
    else if (type.includes("ogg")) ext = "ogg";
    else if (type.includes("mpeg") || type.includes("mpga")) ext = "mpga";
    else if (type.includes("wav")) ext = "wav";
    else if (type.includes("mp3")) ext = "mp3";

    console.log(`[cook] Audio received: ${buf.length} bytes, MIME: ${type}, ext: ${ext}`);
    const file = await toFile(buf, `turn.${ext}`, { type });

    const stt = await groq.audio.transcriptions.create({
      file,
      model: GROQ_STT_MODEL,
      language: "en",
    });
    const transcribed = (stt.text || "").trim();

    if (!transcribed) {
      return res.json({
        transcribed: "",
        response: "I didn't quite catch that — whenever you're ready, tell me again.",
        audioBase64: null,
      });
    }

    const recent = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const chat = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      max_tokens: 150,
      temperature: 0.8,
      messages: [
        { role: "system", content: buildNaanSenseSystem({ recipe, stepIndex, nativeLanguage }) },
        ...recent,
        { role: "user", content: transcribed },
      ],
    });
    const response = (chat.choices?.[0]?.message?.content || "").trim();

    const audioBase64 = (await sarvamTts(response)) ?? (await googleTts(response, "en-IN"));

    res.json({ transcribed, response, audioBase64 });
  } catch (err) {
    console.error("cook turn failed:", err?.message, err?.response?.data ?? err);
    res.status(502).json({ error: "NaanSense had trouble. Please try again." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`EasyPeasy backend listening on http://localhost:${PORT}`);
});

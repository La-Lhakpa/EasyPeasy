import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Groq, { toFile } from "groq-sdk";
import { createClient } from "@supabase/supabase-js"; // New import for Supabase

const PORT = process.env.PORT || 8787;
const MODEL = "gemini-2.0-flash-lite";
// const API_KEY = process.env.GEMINI_API_KEY; // Comment out Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Original Gemini API Key
const GROQ_API_KEY = process.env.GROQ_API_KEY;     // Groq API Key
const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // From your .env
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY; // From your .env
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // New: Service Role Key

// Supabase client for frontend-facing operations (uses anon key, subject to RLS)
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false, // Server-side, no need to persist session here
      },
    })
  : null;

// Supabase client for backend-only operations (uses service role key, bypasses RLS)
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false, // Server-side, no need to persist session here
      },
    })
  : null;


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
- If the learner ASKS what a word means (e.g. "what is chawal in English?", "what do you
  mean by chawal?"), answer the question directly with the clear English word and a short
  meaning — do not treat the word as a practice attempt and never just repeat it back.
  Always pair a native-language word with its English word so the English is unmistakable.

Style rules (important — your replies are read aloud by a voice):
- Reply in 1-3 short sentences. No markdown, no lists, no emoji.
- Use simple, everyday words. Be warm and encouraging.`;

if (!GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY not set — recipe search and /api/naansense are disabled. " +
      "Add a free key from https://aistudio.google.com/apikey to enable them."
  );
}

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function geminiGenerate({ system, contents, generationConfig }) {
  const response = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig,
      systemInstruction: { parts: [{ text: system }] },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini API error");
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function groqGenerate({ system, contents, generationConfig }) {
  const messages = [
    { role: "system", content: system },
    ...contents.map(c => ({ role: c.role === "model" ? "assistant" : c.role, content: c.parts.map(p => p.text).join("\n") }))
  ];

  const chatCompletion = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages,
    max_tokens: generationConfig.maxOutputTokens,
    temperature: generationConfig.temperature,
  });

  return chatCompletion.choices?.[0]?.message?.content || "";
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Pre-voice vocabulary preview. Before the learner speaks during a recipe step,
// we surface 3–5 words they'll hear or say plus one short phrase to practise —
// tuned to their assessed level, confidence, and home language. Returns JSON so
// the frontend can render a warm, scannable card (not a quiz).
const VOCAB_PREVIEW_SYSTEM = `You generate a pre-voice vocabulary preview for a cooking lesson.

You receive: the learner's home language, English level (beginner | intermediate | advanced),
a confidence score (0–1), any weak skills, the recipe name, and the exact instruction for the
step they are about to do.

Your task:
- Choose 3–5 practical cooking words or tool names that appear in (or are clearly needed for)
  this step — words the learner will hear or say in the next few minutes.
- Provide ONE short phrase from this step for them to practise aloud (keep it under 8 words).

Rules for the home-language hint on each word:
- beginner: ALWAYS include a short home-language hint.
- intermediate: include a hint ONLY for unusual or tool words; leave it empty otherwise.
- advanced: no hints (leave every hint empty).
If confidence is below 0.4, make the supportive line warmer and simpler.
If "speaking" is among the weak skills, make the supportive line gently encourage saying it out loud.

Hard rules: only practical cooking words; beginner-friendly; never more than 5 words;
no grammar explanations; never make it feel like a quiz; keep everything easy to scan.

Return ONLY valid JSON in exactly this shape (no markdown, no extra text):
{
  "title": "short encouraging title",
  "subtitle": "one short line",
  "words": [ { "word": "english word", "hint": "home-language hint or empty string" } ],
  "phrase": "one short phrase to say aloud",
  "supportive": "one warm, encouraging instruction"
}`;

app.post("/api/vocab-preview", async (req, res) => {
   if (!GEMINI_API_KEY) return res.status(503).json({ error: "Vocabulary preview is not configured (missing GEMINI_API_KEY)." });

  const { recipe, stepIndex, profile } = req.body || {};
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  const index = Math.min(Math.max(Number(stepIndex) || 0, 0), Math.max(steps.length - 1, 0));
  const step = steps[index];
  if (!step?.instruction) return res.status(400).json({ error: "No recipe step provided." });

  const p = profile || {};
  const userContext =
    `Home language: ${p.home_language || "their first language"}\n` +
    `English level: ${p.level || "beginner"}\n` +
    `Confidence (0-1): ${typeof p.confidence === "number" ? p.confidence.toFixed(2) : "0.4"}\n` +
    `Weak skills: ${Array.isArray(p.weak_skills) && p.weak_skills.length ? p.weak_skills.join(", ") : "none noted"}\n` +
    `Recipe: ${recipe?.name || "a dish"}\n` +
    `Step ${index + 1} of ${steps.length}\n` +
    `Step instruction: "${step.instruction}"`;

  try {
    const reply = await groqGenerate({
      system: VOCAB_PREVIEW_SYSTEM,
      contents: [{ role: "user", parts: [{ text: userContext }] }],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.6,
      },
    });

    const data = JSON.parse(reply);
    const words = Array.isArray(data.words)
      ? data.words
          .slice(0, 5)
          .map((w) => ({
            word: String(w?.word || "").trim(),
            hint: String(w?.hint || "").trim(),
          }))
          .filter((w) => w.word)
      : [];

    res.json({
      title: String(data.title || "Ready for the next step?").trim(),
      subtitle: String(data.subtitle || "A few words you'll hear right now.").trim(),
      words,
      phrase: String(data.phrase || step.phrase || "").trim(),
      supportive: String(data.supportive || "Take your time — you've got this.").trim(),
    });
  } catch (err) {
    console.error("vocab preview failed:", err.message);
    res.status(502).json({ error: "Could not prepare the words right now. Please try again." });
  }
});

// Names of the app's UI languages, used to prompt Gemini clearly. Only these
// three have full translations elsewhere in the app (see frontend/src/locales).
const TRANSLATE_LANGUAGES = { ne: "Nepali", bn: "Bengali" };

// Translates one saved practice phrase into the learner's UI language, once.
// The frontend caches the result on the phrase record (lib/progress.js) so
// this is called at most once per phrase per language, not on every render.
app.post("/api/translate-phrase", async (req, res) => {
  if (!GEMINI_API_KEY) return res.status(503).json({ error: "Translation is not configured (missing GEMINI_API_KEY)." });

  const { text, lang } = req.body || {};
  const clean = (text || "").toString().trim();
  const languageName = TRANSLATE_LANGUAGES[lang];
  if (!clean) return res.status(400).json({ error: "No phrase provided." });
  if (!languageName) return res.status(400).json({ error: "Unsupported language." });

  try {
    const reply = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: `Translate the given English cooking-related sentence into natural, everyday ${languageName}, as spoken by a home cook. Return ONLY the translation — no quotes, no English, no explanation.` },
        { role: "user", content: clean },
      ],
      max_tokens: 120,
      temperature: 0.3,
    });
    const translation = reply.choices?.[0]?.message?.content || "";
    if (!translation) throw new Error("Empty translation");
    res.json({ translation });
  } catch (err) {
    console.error("phrase translation failed:", err.message);
    res.status(502).json({ error: "Could not translate this phrase right now." });
  }
});

app.post("/api/recipes/search", async (req, res) => {
  if (!GROQ_API_KEY) return res.status(503).json({ error: "Recipe search is not configured (missing GROQ_API_KEY)." });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: "No search query provided." });

  try {
    const reply = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful recipe finder. Search results should be JSON with name, description, ingredients, and steps." },
        { role: "user", content: `Find a recipe for: ${query}` },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const data = JSON.parse(reply.choices?.[0]?.message?.content || "");
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
  if (!GROQ_API_KEY) return res.status(503).json({ error: "NaanSense text chat is not configured (missing GROQ_API_KEY)." });

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
    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      max_tokens: 400,
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        ...contents,
      ],
    });
    res.json({ reply: chatCompletion.choices?.[0]?.message?.content || "" });
  } catch (err) {
    console.error("naansense chat failed:", err.message);
    res.status(502).json({ error: "NaanSense is having trouble right now. Please try again." });
  }
});


const VOCAB_EXTRACTION_SYSTEM = `You are a helpful assistant that extracts important vocabulary from a conversation turn. 
Your task is to identify single words or short phrases (1-3 words) that a language learner should save to their word bank. For each extracted phrase, also provide the full sentence from the conversation where it appeared. Only extract genuinely useful vocabulary. Avoid common filler words or phrases.
Return your response as a JSON array of objects, where each object has \'phrase_text\' and \'context_sentence\'.
Example:
[
  { \"phrase_text\": \"cook together\", \"context_sentence\": \"We will cook together.\" },
  { \"phrase_text\": \"delicious\", \"context_sentence\": \"This is a delicious recipe.\" }
]`;

async function extractAndSaveVocabulary(userMessage, assistantResponse, userId) {
  if (!GEMINI_API_KEY || !supabaseAdmin || !userId) {
    console.warn("Cannot extract or save vocabulary: GEMINI_API_KEY, Supabase Admin client, or user ID missing.");
    return;
  }

  const conversationContext = [
    { role: "user", parts: [{ text: userMessage }] },
    { role: "assistant", parts: [{ text: assistantResponse }] },
  ];

  try {
    const reply = await groqGenerate({
      system: VOCAB_EXTRACTION_SYSTEM,
      contents: conversationContext,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.4,
      },
    });

    let extractedWords = [];
    try {
      const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        extractedWords = JSON.parse(jsonMatch[1]);
      } else {
        extractedWords = JSON.parse(reply);
      }
    } catch (parseError) {
      console.error("Error parsing AI response for vocabulary extraction:", parseError.message);
      // Attempt to salvage by looking for JSON within the reply
      const bracketMatch = reply.match(/\[[\s\S]*?\]/);
      if (bracketMatch && bracketMatch[0]) {
        try {
          extractedWords = JSON.parse(bracketMatch[0]);
        } catch (salvageError) {
          console.error("Error salvaging JSON from AI response:", salvageError.message);
          extractedWords = [];
        }
      }
    }

    if (Array.isArray(extractedWords)) {
      for (const word of extractedWords) {
        if (word.phrase_text && word.context_sentence) {
          const { data: existingWords, error: selectError } = await supabaseAdmin
            .from("words")
            .select("id")
            .eq("user_id", userId)
            .eq("term", word.phrase_text);

          if (selectError) {
            console.error("Supabase error checking for existing word:", selectError.message);
            continue;
          }

          if (existingWords && existingWords.length === 0) {
            const { error: insertError } = await supabaseAdmin.from("words").insert({
              user_id: userId,
              term: word.phrase_text,
              meaning: { en: word.context_sentence }, // Store context as English meaning
            });

            if (insertError) {
              console.error("Supabase error saving extracted word:", insertError.message);
            } else {
              console.log(`Successfully saved extracted word: "${word.phrase_text}" for user ${userId}`);
            }
          } else {
            console.log(`Duplicate word "${word.phrase_text}" for user ${userId} not saved.`);
          }
        }
      }
    }
  } catch (err) {
    console.error("AI vocabulary extraction or saving failed:", err.message);
  }
}

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
  console.log("[cook] /api/cook endpoint hit"); // Add this line
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

    const { userId } = req.body; // Receive userId directly from frontend

    if (userId) {
      await extractAndSaveVocabulary(transcribed, response, userId);
    }

    const audioBase64 = (await sarvamTts(response)) ?? (await googleTts(response, "en-IN"));

    res.json({ transcribed, response, audioBase64 });
  } catch (err) {
    console.error("cook turn failed:", err?.message, err?.response?.data ?? err);
    res.status(502).json({ error: "NaanSense had trouble. Please try again." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyPeasy backend listening on http://localhost:${PORT}`);
});

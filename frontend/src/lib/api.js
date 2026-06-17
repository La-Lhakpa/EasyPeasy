// API calls to backend
const API_BASE = "http://localhost:8787";

async function postJson(url, body) {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

// Cook & Converse voice turn: STT → NaanSense chat → TTS
export function cook({ audio, mimeType, recipe, stepIndex, messages, nativeLanguage }) {
  return postJson("/api/cook", { audio, mimeType, recipe, stepIndex, messages, nativeLanguage });
}

// Optional: text-only NaanSense chat (Gemini)
export function chatNaanSense(recipe, messages) {
  return postJson("/api/naansense", { recipe, messages });
}

// Optional: recipe search
export function searchRecipe(query) {
  return postJson("/api/recipes/search", { query });
}

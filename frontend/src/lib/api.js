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
export function cook({ audio, mimeType, recipe, stepIndex, messages, nativeLanguage, userId }) {
  return postJson("/api/cook", { audio, mimeType, recipe, stepIndex, messages, nativeLanguage, userId });
}

// Optional: text-only NaanSense chat (Gemini)
export function chatNaanSense(recipe, messages) {
  return postJson("/api/naansense", { recipe, messages });
}

// Optional: recipe search
export function searchRecipe(query) {
  return postJson("/api/recipes/search", { query });
}

// Pre-voice vocabulary preview for a recipe step, tuned to the learner profile.
// Returns { title, subtitle, words: [{word, hint}], phrase, supportive }.
export function vocabPreview({ recipe, stepIndex, profile }) {
  return postJson("/api/vocab-preview", { recipe, stepIndex, profile });
}

// "Hear It" — server-side TTS (Sarvam Indian voice → Google fallback).
// Returns { audioBase64 } or throws so the caller can fall back to browser speech.
export function tts(text) {
  return postJson("/api/tts", { text });
}

// Supabase: Get all words for the current user.
export async function getWords(userId) {
  const { data, error } = await supabase
    .from("words")
    .select("id, term, meaning")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching words:", error);
    throw error;
  }
  return data;
}

// Supabase: Add a word for the current user.
export async function addWord(userId, { term, meaning }) {
  const { data, error } = await supabase
    .from("words")
    .insert([{ user_id: userId, term, meaning }])
    .select();

  if (error) {
    console.error("Error adding word:", error);
    throw error;
  }
  return data[0];
}

// Supabase: Delete a word for the current user.
export async function deleteWord(userId, wordId) {
  const { error } = await supabase.from("words").delete().eq("id", wordId).eq("user_id", userId);

  if (error) {
    console.error("Error deleting word:", error);
    throw error;
  }
  return true;
}

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// EasyPeasy learner profile
// ---------------------------------------------------------------------------
// Holds the result of the onboarding assessment — the learner's home language,
// English level, self-reported confidence, and any weak skills. This profile is
// the handoff point that personalises everything downstream: it tunes the
// pre-voice vocabulary preview (hint frequency, word difficulty, supportive
// tone) and can later be nudged by usage signals (the "level update" logic).
//
// Storage mirrors the rest of the app: localStorage is the source of truth so it
// works in local-account mode, and when Supabase is configured we also push the
// profile onto the user's auth metadata so it follows them across devices.

import { useSyncExternalStore } from "react";
import { isSupabaseConfigured, supabase } from "./supabase.js";

const STORAGE_KEY = "easypeasy:profile";

const EMPTY = {
  completed: false, // has the learner finished the assessment?
  home_language: null, // e.g. "Nepali"
  level: "beginner", // beginner | intermediate | advanced
  confidence: 0.4, // 0–1, self-reported
  weak_skills: [], // e.g. ["listening", "speaking"]
  assessedAt: null, // ISO timestamp
};

function readStorage() {
  if (typeof localStorage === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

let state = readStorage();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode) — keep working in memory.
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// Keep in sync across tabs / reloads.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      state = readStorage();
      listeners.forEach((l) => l());
    }
  });
}

// ---------------------------------------------------------------------------
// Scoring: turn raw assessment answers into a profile.
// ---------------------------------------------------------------------------
// answers = {
//   home_language: "Nepali",
//   cookScore: 1–5,        // how richly they described cooking in English
//   listenScore: 1–5,      // how much of a sample instruction they understood
//   confidenceScore: 1–5,  // self-reported speaking confidence
// }
export function scoreAssessment(answers) {
  const cook = clamp(answers.cookScore, 1, 5);
  const listen = clamp(answers.listenScore, 1, 5);
  const conf = clamp(answers.confidenceScore, 1, 5);
  const avg = (cook + listen + conf) / 3;

  let level = "intermediate";
  if (avg <= 2) level = "beginner";
  else if (avg >= 4.5) level = "advanced";

  const weak_skills = [];
  if (listen <= 2) weak_skills.push("listening");
  if (conf <= 2) weak_skills.push("speaking");

  return {
    completed: true,
    home_language: answers.home_language || null,
    level,
    confidence: Math.round((avg / 5) * 100) / 100,
    weak_skills,
    assessedAt: new Date().toISOString(),
  };
}

function clamp(n, lo, hi) {
  const v = Number(n);
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function saveProfile(profile) {
  state = { ...EMPTY, ...profile };
  persist();
  listeners.forEach((l) => l());

  // Best-effort sync to Supabase so the profile follows the learner. We never
  // block on this and never surface errors — localStorage already succeeded.
  if (isSupabaseConfigured && supabase) {
    supabase.auth
      .updateUser({
        data: {
          home_language: state.home_language,
          level: state.level,
          confidence: state.confidence,
          weak_skills: state.weak_skills,
        },
      })
      .catch(() => {});
  }
}

// Nudge the profile from usage signals. Never downgrades a level automatically —
// it only promotes, or flags weak skills, mirroring the "level update" design.
export function applySignals({ hintsSkipped = 0, phraseReplayed = 0 } = {}) {
  const next = { ...state };
  let changed = false;

  if (hintsSkipped >= 5 && next.level === "beginner") {
    next.level = "intermediate";
    changed = true;
  }
  if (phraseReplayed >= 3 && !next.weak_skills.includes("speaking")) {
    next.weak_skills = [...next.weak_skills, "speaking"];
    changed = true;
  }

  if (changed) saveProfile(next);
}

// ---------------------------------------------------------------------------
// React binding
// ---------------------------------------------------------------------------

export function useProfile() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

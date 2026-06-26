// EasyPeasy progress store
// ---------------------------------------------------------------------------
// A tiny localStorage-backed store that tracks everything a learner earns as
// they cook: which recipes they've finished, the phrases they've learned (with
// spaced-repetition scheduling), their daily streak, and a small recent-activity
// log. It exposes a `useProgress()` hook (via useSyncExternalStore) so any screen
// re-renders the moment progress changes — no global state library needed.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "easypeasy:progress";

// Spaced-repetition intervals in days. Each time a learner remembers a phrase we
// move them one step further down this ladder; if they forget, we send them back
// to the start. Gentle and forgiving — the goal is confidence, not punishment.
const SR_INTERVALS = [1, 3, 7, 16, 35, 70];

// How many beginner/intermediate recipes must be finished before the next level
// gently opens up. Kept low so it feels like encouragement, not a locked door.
export const UNLOCK_THRESHOLDS = {
  Beginner: 0,
  Intermediate: 2,
  Advanced: 3,
};

const EMPTY = {
  completedRecipes: {}, // recipeId -> { completedAt, name }
  inProgress: {}, // recipeId -> { stepIndex, name, total, updatedAt }
  phrases: {}, // phraseText -> { text, recipeName, learnedAt, dueAt, intervalIdx, reps, lapses, lastReviewedAt }
  streak: { current: 0, longest: 0, lastActiveDate: null },
  recent: [], // [{ text, at }]
  stats: { phrasesPracticed: 0 },
};

// ---------------------------------------------------------------------------
// Date helpers (all in the learner's local time)
// ---------------------------------------------------------------------------

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isYesterday(dateStr, today = localDateString()) {
  if (!dateStr) return false;
  const t = new Date(today);
  t.setDate(t.getDate() - 1);
  return localDateString(t) === dateStr;
}

// ---------------------------------------------------------------------------
// In-memory store + persistence
// ---------------------------------------------------------------------------

function readStorage() {
  if (typeof localStorage === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      ...EMPTY,
      ...parsed,
      streak: { ...EMPTY.streak, ...(parsed.streak || {}) },
      stats: { ...EMPTY.stats, ...(parsed.stats || {}) },
    };
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
    // Storage full or unavailable (private mode) — keep working in memory.
  }
}

// Every mutation goes through here: it replaces `state` with a fresh object so
// useSyncExternalStore sees a new reference, persists, and notifies listeners.
function commit(producer) {
  const next = producer(structuredCloneSafe(state));
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function structuredCloneSafe(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// Keep the streak honest across tabs / reloads without needing a user action.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      state = readStorage();
      listeners.forEach((l) => l());
    }
  });
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

// Call whenever the learner does something meaningful (practice, finish a recipe,
// review a phrase). Advances the streak once per day; resets if a day was missed.
export function recordActivity() {
  commit((draft) => {
    const today = localDateString();
    const last = draft.streak.lastActiveDate;
    if (last === today) return draft; // already counted today
    if (isYesterday(last, today)) {
      draft.streak.current += 1;
    } else {
      draft.streak.current = 1;
    }
    draft.streak.longest = Math.max(draft.streak.longest, draft.streak.current);
    draft.streak.lastActiveDate = today;
    return draft;
  });
}

function pushRecent(draft, text) {
  draft.recent.unshift({ text, at: new Date().toISOString() });
  draft.recent = draft.recent.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Phrases + spaced repetition
// ---------------------------------------------------------------------------

export function addPhrase(text, { recipeName } = {}) {
  const clean = (text || "").trim();
  if (!clean) return;
  commit((draft) => {
    if (!draft.phrases[clean]) {
      const now = new Date();
      const due = new Date(now);
      due.setDate(due.getDate() + SR_INTERVALS[0]);
      draft.phrases[clean] = {
        text: clean,
        recipeName: recipeName || null,
        learnedAt: now.toISOString(),
        dueAt: due.toISOString(),
        intervalIdx: 0,
        reps: 0,
        lapses: 0,
        lastReviewedAt: null,
      };
      draft.stats.phrasesPracticed += 1;
      pushRecent(draft, `Saved: ${clean}`);
    }
    return draft;
  });
  recordActivity();
}

// Grade a review. `remembered === true` promotes the phrase to the next interval;
// `false` sends it gently back to the start so it comes around again soon.
export function reviewPhrase(text, remembered) {
  const clean = (text || "").trim();
  commit((draft) => {
    const p = draft.phrases[clean];
    if (!p) return draft;
    const now = new Date();
    if (remembered) {
      p.intervalIdx = Math.min(p.intervalIdx + 1, SR_INTERVALS.length - 1);
      p.reps += 1;
    } else {
      p.intervalIdx = 0;
      p.lapses += 1;
    }
    const due = new Date(now);
    due.setDate(due.getDate() + SR_INTERVALS[p.intervalIdx]);
    p.dueAt = due.toISOString();
    p.lastReviewedAt = now.toISOString();
    return draft;
  });
  recordActivity();
}

export function getDuePhrases(snapshot = state) {
  const now = Date.now();
  return Object.values(snapshot.phrases)
    .filter((p) => new Date(p.dueAt).getTime() <= now)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

export function getLearnedPhrases(snapshot = state) {
  return Object.values(snapshot.phrases).sort(
    (a, b) => new Date(b.learnedAt) - new Date(a.learnedAt)
  );
}

// ---------------------------------------------------------------------------
// Recipes: in-progress tracking + completion
// ---------------------------------------------------------------------------

export function recipeId(recipe) {
  return (recipe?.name || "").toLowerCase().replace(/\s+/g, "-");
}

// Remember where the learner is in a recipe so "Continue Practice" can resume.
export function setRecipeStep(recipe, stepIndex) {
  const id = recipeId(recipe);
  if (!id) return;
  commit((draft) => {
    draft.inProgress[id] = {
      stepIndex,
      name: recipe.name,
      total: recipe.steps?.length || 0,
      updatedAt: new Date().toISOString(),
    };
    return draft;
  });
}

// Mark a recipe finished and bank every practice phrase from its steps.
export function completeRecipe(recipe) {
  const id = recipeId(recipe);
  if (!id) return;
  const phrases = (recipe.steps || [])
    .map((s) => (s.phrase || "").trim())
    .filter(Boolean);

  commit((draft) => {
    draft.completedRecipes[id] = {
      completedAt: new Date().toISOString(),
      name: recipe.name,
    };
    delete draft.inProgress[id];
    pushRecent(draft, `Finished: ${recipe.name}`);
    return draft;
  });
  phrases.forEach((p) => addPhrase(p, { recipeName: recipe.name }));
  recordActivity();
}

export function isRecipeComplete(id, snapshot = state) {
  return Boolean(snapshot.completedRecipes[id]);
}

// ---------------------------------------------------------------------------
// Difficulty + unlock logic
// ---------------------------------------------------------------------------

// Derive a difficulty from a recipe's tags + length rather than hand-labelling
// all 60 recipes. Festival/special/traditional dishes lean harder; quick and
// everyday dishes lean easier.
export function deriveDifficulty(recipe) {
  const tags = recipe?.tags || [];
  const has = (t) => tags.includes(t);
  if (has("beginner")) return "Beginner";
  const easy = has("quick") || has("everyday");
  const hard = has("festival") || has("special") || has("newari") || has("traditional");
  if (easy) return hard ? "Intermediate" : "Beginner";
  if (hard) return "Advanced";
  return "Intermediate";
}

export function levelStats(recipes, snapshot = state) {
  const counts = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  for (const r of recipes) {
    const id = recipeId(r);
    if (snapshot.completedRecipes[id]) counts[deriveDifficulty(r)] += 1;
  }
  return counts;
}

// Intermediate opens after a couple of beginner wins; Advanced after a few
// intermediate ones. Returns { unlocked, needed, completed }.
export function levelUnlock(level, recipes, snapshot = state) {
  const counts = levelStats(recipes, snapshot);
  if (level === "Beginner") return { unlocked: true, needed: 0, completed: counts.Beginner };
  if (level === "Intermediate") {
    return {
      unlocked: counts.Beginner >= UNLOCK_THRESHOLDS.Intermediate,
      needed: UNLOCK_THRESHOLDS.Intermediate,
      completed: counts.Beginner,
      prereq: "Beginner",
    };
  }
  return {
    unlocked: counts.Intermediate >= UNLOCK_THRESHOLDS.Advanced,
    needed: UNLOCK_THRESHOLDS.Advanced,
    completed: counts.Intermediate,
    prereq: "Intermediate",
  };
}

// ---------------------------------------------------------------------------
// Aggregate stats for dashboards
// ---------------------------------------------------------------------------

export function getStats(snapshot = state) {
  return {
    recipesCompleted: Object.keys(snapshot.completedRecipes).length,
    phrasesLearned: Object.keys(snapshot.phrases).length,
    phrasesDue: getDuePhrases(snapshot).length,
    streak: snapshot.streak.current,
    longestStreak: snapshot.streak.longest,
  };
}

export function getMostRecentInProgress(snapshot = state) {
  const entries = Object.entries(snapshot.inProgress);
  if (entries.length === 0) return null;
  entries.sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt));
  const [id, info] = entries[0];
  return { id, ...info };
}

// ---------------------------------------------------------------------------
// React binding
// ---------------------------------------------------------------------------

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

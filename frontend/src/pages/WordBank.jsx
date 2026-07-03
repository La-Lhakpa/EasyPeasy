import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCcw, Volume2 } from "lucide-react";
import wordBank from "../data/wordBank.json";
import { translatePhrase } from "../lib/api.js";
import { useSpeak } from "../lib/speech.js";
import {
  getDuePhrases,
  getLearnedPhrases,
  setPhraseTranslation,
  useProgress,
} from "../lib/progress.js";

// Only these UI languages have a translation backend (see server.js
// TRANSLATE_LANGUAGES) — English needs no translation of itself.
const TRANSLATABLE_LANGS = new Set(["ne", "bn"]);

export default function WordBank() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("words");
  const progress = useProgress();
  const { speak, speaking, activeText } = useSpeak();
  // Phrases whose translation request failed (e.g. no GEMINI_API_KEY set) —
  // so we can fall back instead of showing "Translating…" forever.
  const [failedTranslations, setFailedTranslations] = useState(() => new Set());

  const lang = i18n.language;
  // The term is always shown in English (that's what they're learning to say);
  // only the meaning follows the chosen language.
  const localizedMeaning = (meaning) => meaning?.[lang] || meaning?.en || "";

  const learned = getLearnedPhrases(progress);
  const due = getDuePhrases(progress).length;

  // Fetch a real translation for any learned phrase that's missing one in the
  // current language, once, then cache it on the phrase record so this only
  // runs again if the learner switches to a different language.
  useEffect(() => {
    if (!TRANSLATABLE_LANGS.has(lang)) return;
    let cancelled = false;
    learned.forEach((p) => {
      const key = `${lang}:${p.text}`;
      if (p.translations?.[lang] || failedTranslations.has(key)) return;
      translatePhrase(p.text, lang)
        .then(({ translation }) => {
          if (!cancelled && translation) setPhraseTranslation(p.text, lang, translation);
        })
        .catch(() => {
          // Backend isn't configured (e.g. missing GEMINI_API_KEY) or the call
          // failed — stop retrying and fall back to the provenance line.
          if (!cancelled) {
            setFailedTranslations((prev) => new Set(prev).add(key));
          }
        });
    });
    return () => {
      cancelled = true;
    };
    // Re-run when the set of learned phrases or the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, learned.length]);

  // Phrases tab = phrases earned by cooking (term stays English; meaning is a
  // real translation once fetched, falling back to a provenance line while it
  // loads or if translation isn't available), plus the curated seed phrases.
  const learnedItems = learned.map((p) => {
    const translated = p.translations?.[lang];
    const fallback = p.recipeName
      ? t("wordbank.learnedWhile", { recipe: p.recipeName })
      : t("wordbank.savedFromPractice");
    let meaning;
    if (lang === "en" || !TRANSLATABLE_LANGS.has(lang)) {
      meaning = fallback;
    } else if (translated) {
      meaning = translated;
    } else if (failedTranslations.has(`${lang}:${p.text}`)) {
      meaning = fallback;
    } else {
      meaning = t("wordbank.translating");
    }
    return { term: p.text, meaning };
  });
  const seedPhraseItems = wordBank.phrases.map((p) => ({
    term: p.term,
    meaning: localizedMeaning(p.meaning),
  }));
  const wordItems = wordBank.words.map((w) => ({
    term: w.term,
    meaning: localizedMeaning(w.meaning),
  }));

  const items = tab === "words" ? wordItems : [...learnedItems, ...seedPhraseItems];

  return (
    <div className="page-stack wordbank-page">
      <h1 className="wordbank-title">{t("wordbank.title")}</h1>

      {due > 0 && (
        <Link to="/review" className="review-card compact">
          <RotateCcw size={20} aria-hidden="true" />
          <div>
            <strong>
              {t(due === 1 ? "wordbank.reviewReadyOne" : "wordbank.reviewReady", { count: due })}
            </strong>
            <p>{t("wordbank.reviewBody")}</p>
          </div>
        </Link>
      )}

      <div className="wordbank-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "words"}
          className={`wordbank-tab ${tab === "words" ? "active" : ""}`}
          onClick={() => setTab("words")}
        >
          {t("wordbank.words")}
        </button>
        <button
          role="tab"
          aria-selected={tab === "phrases"}
          className={`wordbank-tab ${tab === "phrases" ? "active" : ""}`}
          onClick={() => setTab("phrases")}
        >
          {t("wordbank.phrases")}{learned.length > 0 ? ` (${learned.length})` : ""}
        </button>
      </div>

      <div className="wordbank-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>{t("wordbank.empty")}</p>
          </div>
        ) : (
          items.map(({ term, meaning }) => (
            <article className="wordbank-card" key={term}>
              <div className="wordbank-card-head">
                {/* Term stays in English — it's the phrase they're learning to say */}
                <h2 lang="en">{term}</h2>
                <button
                  className="wordbank-speak"
                  type="button"
                  aria-label={`Hear ${term}`}
                  aria-pressed={speaking && activeText === term.trim()}
                  onClick={() => speak(term)}
                >
                  <Volume2 size={22} aria-hidden="true" />
                </button>
              </div>
              {/* Meaning is shown in the learner's chosen language */}
              <p lang={lang}>{meaning}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCcw, Volume2 } from "lucide-react";
import wordBank from "../data/wordBank.json";
import { useSpeak } from "../lib/speech.js";
import { getDuePhrases, getLearnedPhrases, useProgress } from "../lib/progress.js";

export default function WordBank() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("words");
  const progress = useProgress();
  const { speak, speaking, activeText } = useSpeak();

  const lang = i18n.language;
  // The term is always shown in English (that's what they're learning to say);
  // only the meaning follows the chosen language.
  const localizedMeaning = (meaning) => meaning?.[lang] || meaning?.en || "";

  const learned = getLearnedPhrases(progress);
  const due = getDuePhrases(progress).length;

  // Phrases tab = phrases earned by cooking (term English, meaning is a
  // localized helper line), plus the curated seed phrases.
  const learnedItems = learned.map((p) => ({
    term: p.text,
    meaning: p.recipeName
      ? t("wordbank.learnedWhile", { recipe: p.recipeName })
      : t("wordbank.savedFromPractice"),
  }));
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

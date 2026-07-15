import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCcw, Volume2, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { getWords, deleteWord } from "../lib/api.js";
import { useSpeak } from "../lib/speech.js";
import { getDuePhrases, getLearnedPhrases, useProgress } from "../lib/progress.js";
import wordBank from "../data/wordBank.json";

export default function WordBank() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("words");
  const [words, setWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const progress = useProgress();
  const { speak, speaking, activeText } = useSpeak();
  const { user } = useAuth();

  const lang = i18n.language;
  // The term is always shown in English (that\'s what they\'re learning to say);
  // only the meaning follows the chosen language.
  const localizedMeaning = (meaning) => meaning?.[lang] || meaning?.en || "";

  useEffect(() => {
    async function fetchWords() {
      if (!user) return;
      setLoadingWords(true);
      try {
        const userWords = await getWords(user.id);
        setWords(userWords);
      } catch (error) {
        console.error("Failed to fetch words:", error);
      }
      setLoadingWords(false);
    }
    fetchWords();
  }, [user]);

  const handleDeleteWord = async (wordId) => {
    if (!user) return;
    try {
      await deleteWord(user.id, wordId);
      setWords(words.filter((word) => word.id !== wordId));
    } catch (error) {
      console.error("Failed to delete word:", error);
    }
  };

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

  const wordItems = words.map((w) => ({
    id: w.id,
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
          {t("wordbank.words")}{loadingWords ? " (loading...)" : ""}
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
          items.map(({ id, term, meaning }) => (
            <article className="wordbank-card" key={id || term}>
              <div className="wordbank-card-head">
                {/* Term stays in English — it\"s the phrase they\"re learning to say */}
                <h2 lang="en">{term}</h2>
                <div className="wordbank-card-actions">
                  <button
                    className="wordbank-speak"
                    type="button"
                    aria-label={`Hear ${term}`}
                    aria-pressed={speaking && activeText === term.trim()}
                    onClick={() => speak(term)}
                  >
                    <Volume2 size={22} aria-hidden="true" />
                  </button>
                  {id && (
                    <button
                      className="wordbank-delete"
                      type="button"
                      aria-label={`Delete ${term}`}
                      onClick={() => handleDeleteWord(id)}
                    >
                      <Trash2 size={22} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              {/* Meaning is shown in the learner\"s chosen language */}
              <p lang={lang}>{meaning}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

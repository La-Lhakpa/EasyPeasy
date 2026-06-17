import { useState } from "react";
import { Volume2 } from "lucide-react";
import wordBank from "../data/wordBank.json";

export default function WordBank() {
  const [tab, setTab] = useState("words");
  const items = tab === "words" ? wordBank.words : wordBank.phrases;

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="page-stack wordbank-page">
      <h1 className="wordbank-title">Word Bank</h1>

      <div className="wordbank-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "words"}
          className={`wordbank-tab ${tab === "words" ? "active" : ""}`}
          onClick={() => setTab("words")}
        >
          Words
        </button>
        <button
          role="tab"
          aria-selected={tab === "phrases"}
          className={`wordbank-tab ${tab === "phrases" ? "active" : ""}`}
          onClick={() => setTab("phrases")}
        >
          Phrases
        </button>
      </div>

      <div className="wordbank-list">
        {items.map(({ term, definition }) => (
          <article className="wordbank-card" key={term}>
            <div className="wordbank-card-head">
              <h2>{term}</h2>
              <button
                className="wordbank-speak"
                type="button"
                aria-label={`Hear ${term}`}
                onClick={() => speak(term)}
              >
                <Volume2 size={22} aria-hidden="true" />
              </button>
            </div>
            <p>{definition}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

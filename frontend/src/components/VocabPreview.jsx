// VocabPreview — the pre-voice vocabulary card.
// ---------------------------------------------------------------------------
// Shown just before the learner practises a recipe step. It fetches 3–5 words
// they'll hear or say, plus one short phrase to say aloud — all tuned to their
// assessed profile (hint frequency, difficulty, supportive tone). Home-language
// hints appear in parentheses for beginners. It's meant to be glanced at, not
// studied, so it stays short and warm and never feels like a quiz.

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Volume2 } from "lucide-react";
import { vocabPreview } from "../lib/api.js";
import { useSpeak } from "../lib/speech.js";

export default function VocabPreview({ recipe, stepIndex, profile, onPracticeSpoken }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const { speak, speaking, activeText } = useSpeak();
  const replayedRef = useRef(false);

  useEffect(() => {
    let active = true;
    replayedRef.current = false;
    setState({ loading: true, error: null, data: null });

    vocabPreview({ recipe, stepIndex, profile })
      .then((data) => active && setState({ loading: false, error: null, data }))
      .catch((err) =>
        active && setState({ loading: false, error: err.message, data: null })
      );

    return () => {
      active = false;
    };
    // Re-fetch whenever the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.name, stepIndex]);

  const { loading, error, data } = state;

  if (loading) {
    return (
      <article className="vocab-preview loading">
        <Loader2 size={20} className="spin" aria-hidden="true" />
        <span>Getting your words ready…</span>
      </article>
    );
  }

  // Quiet failure: the step itself still works without the preview.
  if (error || !data) return null;

  const handleSpeakPhrase = () => {
    speak(data.phrase);
    // Replaying the practice phrase is a "still learning to speak" signal.
    if (replayedRef.current) onPracticeSpoken?.();
    replayedRef.current = true;
  };

  return (
    <article className="vocab-preview">
      <header className="vocab-preview-head">
        <Sparkles size={18} aria-hidden="true" />
        <div>
          <strong>{data.title}</strong>
          <p>{data.subtitle}</p>
        </div>
      </header>

      <ul className="vocab-words">
        {data.words.map((w) => (
          <li key={w.word}>
            <span className="vocab-word" lang="en">{w.word}</span>
            {w.hint ? <span className="vocab-hint"> ({w.hint})</span> : null}
          </li>
        ))}
      </ul>

      {data.phrase && (
        <div className="vocab-phrase">
          <span>Say it aloud</span>
          <strong lang="en">"{data.phrase}"</strong>
          <button
            type="button"
            className="action-button soft"
            onClick={handleSpeakPhrase}
            aria-pressed={speaking && activeText === data.phrase?.trim()}
          >
            <Volume2 size={16} aria-hidden="true" />
            {speaking && activeText === data.phrase?.trim() ? "Playing…" : "Hear it"}
          </button>
        </div>
      )}

      <p className="vocab-supportive">{data.supportive}</p>
    </article>
  );
}

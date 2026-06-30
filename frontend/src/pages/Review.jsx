import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, PartyPopper, RotateCcw, Volume2, X } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useSpeak } from "../lib/speech.js";
import { getDuePhrases, reviewPhrase, useProgress } from "../lib/progress.js";

export default function Review() {
  const { t } = useTranslation();
  const progress = useProgress();
  const { speak, speaking, activeText } = useSpeak();

  // Snapshot the due queue once at mount. Grading a phrase pushes its next due
  // date into the future, so we walk a fixed list instead of a shrinking one.
  const queue = useMemo(() => getDuePhrases(progress), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [remembered, setRemembered] = useState(0);

  const current = queue[index];
  const done = index >= queue.length;

  const grade = (didRemember) => {
    if (current) reviewPhrase(current.text, didRemember);
    if (didRemember) setRemembered((n) => n + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  if (queue.length === 0) {
    return (
      <div className="page-stack review-page">
        <PageHeader title={t("review.title")} subtitle={t("review.subtitleFresh")} />
        <div className="celebrate-card">
          <Check size={22} aria-hidden="true" />
          <div>
            <strong>{t("review.caughtUpTitle")}</strong>
            <p>{t("review.caughtUpBody")}</p>
          </div>
          <Link className="text-link-button" to="/cooking">
            {t("common.startCooking")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page-stack review-page">
        <PageHeader title={t("review.title")} subtitle={t("review.subtitleDone")} />
        <div className="celebrate-card">
          <PartyPopper size={22} aria-hidden="true" />
          <div>
            <strong>{t("review.finishedTitle", { remembered, total: queue.length })}</strong>
            <p>{t("review.finishedBody")}</p>
          </div>
          <Link className="text-link-button" to="/">
            {t("common.backHome")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack review-page">
      <PageHeader
        eyebrow={t("review.cardOf", { index: index + 1, total: queue.length })}
        title={t("review.title")}
        subtitle={t("review.subtitleQuestion")}
      />

      <div className="step-meter" aria-hidden="true">
        {queue.map((_, i) => (
          <span key={i} className={i < index ? "filled" : ""} />
        ))}
      </div>

      <article className="flashcard">
        <p className="flashcard-phrase" lang="en">"{current.text}"</p>
        {current.recipeName && (
          <p className="flashcard-source">{t("review.fromRecipe", { recipe: current.recipeName })}</p>
        )}
        <button
          type="button"
          className="action-button soft"
          onClick={() => speak(current.text)}
        >
          <Volume2 size={18} aria-hidden="true" />
          {speaking && activeText === current.text ? t("session.playing") : t("session.hearIt")}
        </button>
      </article>

      {!revealed ? (
        <button
          type="button"
          className="action-button primary full"
          onClick={() => setRevealed(true)}
        >
          {t("review.showAnswer")}
        </button>
      ) : (
        <div className="chat-input">
          <button type="button" className="action-button ghost" onClick={() => grade(false)}>
            <X size={18} aria-hidden="true" /> {t("review.stillLearning")}
          </button>
          <button type="button" className="action-button primary" onClick={() => grade(true)}>
            <Check size={18} aria-hidden="true" /> {t("review.remember")}
          </button>
        </div>
      )}

      <p className="review-hint">
        <RotateCcw size={14} aria-hidden="true" /> {t("review.hint")}
      </p>
    </div>
  );
}

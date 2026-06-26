import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  MessageCircle,
  PartyPopper,
  Plus,
  Volume2,
} from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/easypeasy_recipes.json";
import { useSpeak } from "../lib/speech.js";
import {
  addPhrase,
  completeRecipe,
  isRecipeComplete,
  recipeId,
  setRecipeStep,
  useProgress,
} from "../lib/progress.js";

export default function CookingSession() {
  const { t } = useTranslation();
  const { recipeId: routeId } = useParams();
  const recipe = useMemo(
    () =>
      recipes.find(
        (item) => item.name && item.name.toLowerCase().replace(/\s+/g, "-") === routeId
      ) || recipes[0],
    [routeId]
  );

  const id = recipeId(recipe);
  const steps = recipe.steps || [];
  const totalSteps = steps.length;

  const progress = useProgress();
  const { speak, speaking, activeText } = useSpeak();

  const [stepIndex, setStepIndex] = useState(
    () => progress.inProgress[id]?.stepIndex ?? 0
  );
  const [celebrate, setCelebrate] = useState(false);

  const step = steps[stepIndex];
  const completed = isRecipeComplete(id, progress);

  // If the user switches to a different recipe (route param change), jump to
  // wherever they last left off in that recipe (or its first step).
  useEffect(() => {
    setStepIndex(progress.inProgress[id]?.stepIndex ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Remember where they are so "Continue Practice" on Home can resume.
  useEffect(() => {
    if (!completed) setRecipeStep(recipe, stepIndex);
  }, [recipe, stepIndex, completed]);

  const phraseSaved = step && Boolean(progress.phrases[step.phrase?.trim()]);
  const isLastStep = stepIndex >= totalSteps - 1;

  const handleSave = () => {
    if (step?.phrase) addPhrase(step.phrase, { recipeName: recipe.name });
  };

  const handleFinish = () => {
    completeRecipe(recipe);
    setCelebrate(true);
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("session.stepOf", { step: stepIndex + 1, total: totalSteps })}
        title={recipe.name}
        subtitle={t("session.subtitle")}
      />

      {/* Visual progress through the recipe's steps */}
      <div className="step-meter" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className={i <= stepIndex ? "filled" : ""} />
        ))}
      </div>

      <article className="session-card">
        <img src={recipe.image} alt={recipe.name} />
        <div className="session-content">
          <SectionHeader title={t("session.instruction")} />
          <p className="instruction" lang="en">{step.instruction}</p>
          <div className="practice-phrase">
            <span>{t("session.practicePhrase")}</span>
            <strong lang="en">"{step.phrase}"</strong>
          </div>
          <div className="button-row">
            <ActionButton
              icon={Volume2}
              variant="soft"
              onClick={() => speak(step.phrase)}
              aria-pressed={speaking && activeText === step.phrase?.trim()}
            >
              {speaking && activeText === step.phrase?.trim() ? t("session.playing") : t("session.hearIt")}
            </ActionButton>
            <ActionButton
              icon={phraseSaved ? Check : Plus}
              variant={phraseSaved ? "ghost" : "primary"}
              onClick={handleSave}
              disabled={phraseSaved}
            >
              {phraseSaved ? t("session.saved") : t("session.savePhrase")}
            </ActionButton>
          </div>
        </div>
      </article>

      {/* Step navigation */}
      <div className="chat-input">
        <button
          type="button"
          className="action-button ghost"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          <ArrowLeft size={18} aria-hidden="true" /> {t("common.back")}
        </button>
        {!isLastStep ? (
          <button
            type="button"
            className="action-button primary"
            onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
          >
            {t("common.next")} <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="action-button primary"
            onClick={handleFinish}
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            {completed ? t("session.practiceAgain") : t("session.finish")}
          </button>
        )}
      </div>

      {(completed || celebrate) && (
        <div className="celebrate-card">
          <PartyPopper size={22} aria-hidden="true" />
          <div>
            <strong>{t("session.celebrateTitle", { recipe: recipe.name })}</strong>
            <p>{t("session.celebrateBody")}</p>
          </div>
          <Link className="text-link-button" to="/word-bank">
            {t("common.seeMyWords")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      <Link
        className="primary-link full"
        to={`/cooking/${recipe.name.toLowerCase().replace(/\s+/g, "-")}/conversation`}
      >
        <MessageCircle size={18} aria-hidden="true" />
        {t("session.talkTo")} <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

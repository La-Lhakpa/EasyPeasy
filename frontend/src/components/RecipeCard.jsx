import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import {
  deriveDifficulty,
  isRecipeComplete,
  recipeId,
  useProgress,
} from "../lib/progress.js";

const PLACEHOLDER = "/recipe-images/_placeholder.svg";
const LEVEL_KEY = { Beginner: "beginner", Intermediate: "intermediate", Advanced: "advanced" };

export default function RecipeCard({ recipe, locked = false }) {
  const { t } = useTranslation();
  const progress = useProgress();
  const id = recipeId(recipe);
  const difficulty = deriveDifficulty(recipe);
  const completed = isRecipeComplete(id, progress);
  const inProgress = progress.inProgress[id];

  const total = recipe.steps?.length || 1;
  const percent = completed
    ? 100
    : inProgress
    ? Math.round(((inProgress.stepIndex + 1) / total) * 100)
    : 0;

  const difficultyLabel = t(`cooking.${LEVEL_KEY[difficulty]}`);
  const label = completed
    ? t("cooking.completed")
    : inProgress
    ? t("cooking.inProgress")
    : difficultyLabel;

  const image = (
    <img
      src={recipe.image || PLACEHOLDER}
      alt={recipe.name}
      loading="lazy"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
          e.currentTarget.src = PLACEHOLDER;
        }
      }}
    />
  );

  if (locked) {
    return (
      <article className="recipe-card locked" aria-disabled="true">
        {image}
        <div className="card-body">
          <div className="card-title-row">
            <h3>{recipe.name}</h3>
            <span className={`difficulty-badge ${difficulty.toLowerCase()}`}>{difficultyLabel}</span>
          </div>
          <p>{recipe.description}</p>
          <div className="locked-row">
            <Lock size={16} aria-hidden="true" />
            <span>{t("cooking.lockedCard")}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`recipe-card ${completed ? "is-complete" : ""}`}>
      {image}
      <div className="card-body">
        <div className="card-title-row">
          <h3>{recipe.name}</h3>
          <span className={`difficulty-badge ${difficulty.toLowerCase()}`}>
            {completed && <CheckCircle2 size={13} aria-hidden="true" />}
            {label}
          </span>
        </div>
        <p>{recipe.description}</p>
        <div className="meter" aria-label={`${percent}% complete`}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <Link
          className="text-link-button"
          to={`/cooking/${recipe.name.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {completed ? t("common.cookAgain") : inProgress ? t("common.resume") : t("common.cook")}{" "}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

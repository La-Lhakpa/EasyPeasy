import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Search } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/easypeasy_recipes.json";
import { deriveDifficulty, levelUnlock, useProgress } from "../lib/progress.js";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_KEY = { Beginner: "beginner", Intermediate: "intermediate", Advanced: "advanced" };

export default function CookingHub() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const progress = useProgress();

  // Translated, lower-cased level name for inline use in unlock sentences.
  const levelName = (level) => t(`cooking.${LEVEL_KEY[level]}`);

  const filteredRecipes = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const byLevel = useMemo(() => {
    const groups = { Beginner: [], Intermediate: [], Advanced: [] };
    for (const r of recipes) groups[deriveDifficulty(r)].push(r);
    return groups;
  }, []);

  return (
    <div className="page-stack">
      <PageHeader title={t("cooking.title")} subtitle={t("cooking.subtitle")} />

      <section>
        <div className="search-box">
          <Search size={20} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder={t("cooking.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label={t("cooking.searchPlaceholder")}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="search-clear"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="search-results-info">
            {t("cooking.found", { count: filteredRecipes.length })}
          </p>
        )}
      </section>

      {/* Search overrides the levelled view and shows a flat list. */}
      {searchQuery ? (
        <section>
          <SectionHeader title={t("cooking.recipes")} subtitle={t("cooking.searchResults")} />
          {filteredRecipes.length > 0 ? (
            <div className="recipe-grid">
              {filteredRecipes.map((recipe) => (
                <RecipeCard recipe={recipe} key={recipe.name} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>{t("cooking.noResults")}</p>
            </div>
          )}
        </section>
      ) : (
        LEVELS.map((level) => {
          const unlock = levelUnlock(level, recipes, progress);
          const remaining = Math.max(unlock.needed - unlock.completed, 0);
          return (
            <section key={level}>
              <SectionHeader
                title={t(`cooking.${LEVEL_KEY[level]}`)}
                subtitle={
                  unlock.unlocked
                    ? t(`cooking.${LEVEL_KEY[level]}Blurb`)
                    : t(remaining === 1 ? "cooking.unlockHintOne" : "cooking.unlockHint", {
                        count: remaining,
                        level: levelName(unlock.prereq),
                      })
                }
              />
              {!unlock.unlocked && (
                <div className="level-lock-banner">
                  <Lock size={16} aria-hidden="true" />
                  <span>
                    {t("cooking.lockBanner", {
                      done: unlock.completed,
                      need: unlock.needed,
                      level: levelName(unlock.prereq),
                    })}
                  </span>
                </div>
              )}
              <div className="recipe-grid">
                {byLevel[level].map((recipe) => (
                  <RecipeCard recipe={recipe} key={recipe.name} locked={!unlock.unlocked} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

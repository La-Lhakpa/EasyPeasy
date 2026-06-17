import { useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/easypeasy_recipes.json";

export default function CookingHub() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Cooking Practice"
        subtitle="Learn English while you cook."
      />

      <section>
        <div className="search-box">
          <Search size={20} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search recipes by name or cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search recipes"
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
            Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
          </p>
        )}
      </section>

      <section>
        <SectionHeader
          title="Recipes"
          subtitle={searchQuery ? "Search results" : "Start with food you already know."}
        />
        {filteredRecipes.length > 0 ? (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.name} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recipes found. Try searching for "dal", "momo", "curry", or your favorite dish.</p>
          </div>
        )}
      </section>
    </div>
  );
}

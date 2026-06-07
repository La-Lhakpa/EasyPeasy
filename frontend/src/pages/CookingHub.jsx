import PageHeader from "../components/PageHeader.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/recipes.json";

export default function CookingHub() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Cooking Practice"
        subtitle="Learn English while you cook."
      />
      <section>
        <SectionHeader title="Recipes" subtitle="Start with food you already know." />
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard recipe={recipe} key={recipe.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

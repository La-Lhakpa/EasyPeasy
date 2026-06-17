import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function RecipeCard({ recipe }) {
  return (
    <article className="recipe-card">
      <img src={recipe.image} alt={recipe.name} />
      <div className="card-body">
        <div className="card-title-row">
          <h3>{recipe.name}</h3>
          <span>{recipe.progressLabel}</span>
        </div>
        <p>{recipe.description}</p>
        <div className="meter" aria-label={recipe.progressLabel}>
          <span style={{ width: `${recipe.progress}%` }} />
        </div>
        <Link className="text-link-button" to={`/cooking/${recipe.name.toLowerCase().replace(/\s+/g, "-")}`}>
          Cook <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

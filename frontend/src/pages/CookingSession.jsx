import { Link, useParams } from "react-router-dom";
import { ArrowRight, Languages, MessageCircle, Mic, Volume2 } from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/easypeasy_recipes.json";

export default function CookingSession() {
  const { recipeId } = useParams();
  const recipe = recipes.find((item) => item.name && item.name.toLowerCase().replace(/\s+/g, "-") === recipeId) || recipes[0];
  const stepIndex = 0;
  const step = recipe.steps?.[stepIndex];
  const totalSteps = recipe.steps?.length || 0;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`Step ${stepIndex + 1} of ${totalSteps}`}
        title={recipe.name}
        subtitle="Practice one small phrase before moving on."
      />

      <article className="session-card">
        <img src={recipe.image} alt={recipe.name} />
        <div className="session-content">
          <SectionHeader title="Cooking Instruction" />
          <p className="instruction">{step.instruction}</p>
          <div className="practice-phrase">
            <span>Practice phrase</span>
            <strong>"{step.phrase}"</strong>
          </div>
          <div className="button-row">
            <ActionButton icon={Volume2} variant="soft">Hear It</ActionButton>
            <ActionButton icon={Mic} variant="primary">Say It</ActionButton>
            <ActionButton icon={Languages} variant="ghost">Translate</ActionButton>
          </div>
        </div>
      </article>

      <Link className="primary-link full" to={`/cooking/${recipe.name.toLowerCase().replace(/\s+/g, "-")}/conversation`}>
        <MessageCircle size={18} aria-hidden="true" />
        Talk to NaanSense <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

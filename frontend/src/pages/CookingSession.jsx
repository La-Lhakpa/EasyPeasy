import { Link, useParams } from "react-router-dom";
import { ArrowRight, Languages, MessageCircle, Mic, Volume2 } from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import recipes from "../data/recipes.json";

export default function CookingSession() {
  const { recipeId } = useParams();
  const recipe = recipes.find((item) => item.id === recipeId) || recipes[0];
  const stepIndex = recipe.id === "making-dal" ? 0 : 0;
  const step = recipe.steps[stepIndex];
  const totalSteps = recipe.id === "making-dal" ? 8 : recipe.steps.length;

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

      <div className="split-actions">
        <Link className="secondary-link" to={`/cooking/${recipe.id}/conversation`}>
          <MessageCircle size={18} aria-hidden="true" />
          Conversation Practice
        </Link>
        <Link className="primary-link" to={`/cooking/${recipe.id}/conversation`}>
          Next Step <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

import { Link, useParams } from "react-router-dom";
import { ArrowRight, RotateCcw, Volume2 } from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import ConversationBubble from "../components/ConversationBubble.jsx";
import PageHeader from "../components/PageHeader.jsx";
import recipes from "../data/recipes.json";

export default function CookingConversation() {
  const { recipeId } = useParams();
  const recipe = recipes.find((item) => item.id === recipeId) || recipes[0];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Conversation Practice"
        title={recipe.name}
        subtitle="Practice natural speaking with kind correction."
      />

      <section className="conversation-panel">
        <ConversationBubble speaker="Helper" tone="assistant">
          What are you doing now?
        </ConversationBubble>
        <ConversationBubble speaker="You" tone="user">
          I cutting onion.
        </ConversationBubble>
        <ConversationBubble speaker="Helper" tone="assistant">
          Wonderful. You can say: <strong>"I am cutting onions."</strong> Let's try together.
        </ConversationBubble>
      </section>

      <div className="button-row">
        <ActionButton icon={Volume2} variant="soft">Hear Again</ActionButton>
        <ActionButton icon={RotateCcw} variant="primary">Repeat</ActionButton>
      </div>

      <Link className="primary-link full" to={`/cooking/${recipe.id}`}>
        Continue <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

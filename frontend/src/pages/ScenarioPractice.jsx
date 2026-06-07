import { Bookmark, Languages, RotateCcw, Volume2 } from "lucide-react";
import ActionButton from "../components/ActionButton.jsx";
import ConversationBubble from "../components/ConversationBubble.jsx";
import PageHeader from "../components/PageHeader.jsx";
import PhraseCard from "../components/PhraseCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import scenarios from "../data/dailyLifeScenarios.json";

export default function ScenarioPractice({ scenarioId, emergency = false }) {
  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
  const practicePhrases = scenario.phrases.map((text, index) => ({
    id: `${scenario.id}-${index}`,
    category: scenario.title,
    text,
    translation: emergency ? "Tap when you need this quickly." : "Practice slowly, one phrase at a time."
  }));

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Daily Life Practice"
        title={scenario.title}
        subtitle={emergency ? "Quick phrases for urgent moments." : "Practice the words you may need outside the home."}
      />

      <section className={`practice-panel ${emergency ? "emergency-panel" : ""}`}>
        <ConversationBubble speaker="Helper" tone="assistant">
          {scenario.opening}
        </ConversationBubble>
        <div className="target-phrase">
          <span>Target phrase</span>
          <strong>"{scenario.targetPhrase}"</strong>
        </div>
        <div className="button-row">
          <ActionButton icon={Volume2} variant="soft">Hear It</ActionButton>
          <ActionButton icon={RotateCcw} variant="primary">Repeat</ActionButton>
          <ActionButton icon={Languages} variant="ghost">Translate</ActionButton>
        </div>
      </section>

      <section>
        <SectionHeader title={emergency ? "Quick Access Phrases" : "Practice Phrases"} />
        <div className={emergency ? "emergency-grid" : "phrase-list"}>
          {practicePhrases.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} compact={!emergency} />
          ))}
        </div>
      </section>

      <div className="save-strip">
        <Bookmark size={20} aria-hidden="true" />
        <span>Useful phrases can be saved to the Phrase Bank for later practice.</span>
      </div>
    </div>
  );
}

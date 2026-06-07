import PageHeader from "../components/PageHeader.jsx";
import ScenarioCard from "../components/ScenarioCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import scenarios from "../data/dailyLifeScenarios.json";
import { withScenarioIcons } from "./scenarioIcons.js";

export default function DailyLifeHub() {
  const scenarioCards = withScenarioIcons(scenarios);

  return (
    <div className="page-stack">
      <PageHeader
        title="Everyday Conversations"
        subtitle="Practice small phrases for real moments outside the kitchen."
      />
      <section>
        <SectionHeader title="Choose a Situation" subtitle="Start where you need the most confidence today." />
        <div className="scenario-grid">
          {scenarioCards.map((scenario) => (
            <ScenarioCard scenario={scenario} key={scenario.id} featured={scenario.id === "emergency"} />
          ))}
        </div>
      </section>
    </div>
  );
}

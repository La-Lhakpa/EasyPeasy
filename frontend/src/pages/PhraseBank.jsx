import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import PhraseCard from "../components/PhraseCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import phrases from "../data/phrases.json";

const categories = ["Cooking", "Doctor", "School", "Grocery", "Emergency"];

export default function PhraseBank() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Saved Words"
        title="Phrase Bank"
        subtitle="Keep helpful phrases close for gentle practice."
      />
      {categories.map((category) => {
        const items = phrases.filter((phrase) => phrase.category === category);
        return (
          <section key={category}>
            <SectionHeader title={category} />
            {items.length ? (
              <div className="phrase-list">
                {items.map((phrase) => (
                  <PhraseCard phrase={phrase} key={phrase.id} />
                ))}
              </div>
            ) : (
              <EmptyState title="No saved phrases yet" message="Practice phrases can be saved here." />
            )}
          </section>
        );
      })}
    </div>
  );
}

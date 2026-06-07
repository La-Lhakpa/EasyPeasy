import { Bookmark, Play, Volume2 } from "lucide-react";
import ActionButton from "./ActionButton.jsx";

export default function PhraseCard({ phrase, compact = false }) {
  return (
    <article className={`phrase-card ${compact ? "compact" : ""}`}>
      <div>
        <span className="tag">{phrase.category}</span>
        <p className="phrase-text">"{phrase.text}"</p>
        {phrase.translation ? <p className="translation">{phrase.translation}</p> : null}
      </div>
      <div className="phrase-actions">
        <ActionButton icon={compact ? Play : Volume2} variant="soft" size="compact">
          Play
        </ActionButton>
        <ActionButton icon={Bookmark} variant="ghost" size="compact">
          Save
        </ActionButton>
      </div>
    </article>
  );
}

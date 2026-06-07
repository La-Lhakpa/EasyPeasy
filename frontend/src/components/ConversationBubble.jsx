export default function ConversationBubble({ speaker, children, tone = "assistant" }) {
  return (
    <div className={`conversation-row ${tone}`}>
      <div className="speaker">{speaker}</div>
      <div className="bubble">{children}</div>
    </div>
  );
}

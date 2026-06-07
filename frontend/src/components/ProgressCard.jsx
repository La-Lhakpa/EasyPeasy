import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ProgressCard({ title, subtitle, progress, to, image }) {
  return (
    <article className="progress-card">
      {image ? <img src={image} alt="" /> : null}
      <div className="progress-card-body">
        <div>
          <p className="eyebrow">Continue Practice</p>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="meter" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <Link className="text-link-button" to={to}>
          Resume <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

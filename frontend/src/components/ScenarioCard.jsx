import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ScenarioCard({ scenario, featured = false }) {
  return (
    <Link className={`scenario-card ${featured ? "featured" : ""}`} to={scenario.path}>
      <div className="scenario-icon" aria-hidden="true">
        <scenario.icon size={24} />
      </div>
      <div>
        <h3>{scenario.title}</h3>
        <p>{scenario.description}</p>
      </div>
      <ArrowRight className="scenario-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}

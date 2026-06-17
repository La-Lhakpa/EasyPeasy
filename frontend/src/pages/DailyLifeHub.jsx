import { Link } from "react-router-dom";
import { GraduationCap, Lock, ShoppingCart, Soup, Sparkles, Stethoscope } from "lucide-react";

const tiles = [
  { label: "Cooking", icon: Soup, to: "/cooking", locked: false },
  { label: "Doctor Visit", icon: Stethoscope, to: "/daily-life/doctor-visit", locked: true },
  { label: "Grocery", icon: ShoppingCart, to: "/daily-life/grocery-store", locked: true },
  { label: "School Visit", icon: GraduationCap, to: "/daily-life/parent-teacher-meeting", locked: true }
];

export default function DailyLifeHub() {
  return (
    <div className="page-stack daily-page">
      <h1 className="daily-title">Daily Life</h1>

      <div className="daily-grid">
        {tiles.map(({ label, icon: Icon, to, locked }) => {
          const Card = locked ? "div" : Link;
          return (
            <div className="daily-item" key={label}>
              <Card
                className={`daily-card ${locked ? "locked" : ""}`}
                {...(locked ? {} : { to })}
              >
                <Icon size={52} strokeWidth={1.5} aria-hidden="true" />
                {locked && (
                  <span className="daily-lock" aria-label="Premium">
                    <Lock size={16} aria-hidden="true" />
                  </span>
                )}
              </Card>
              <span className="daily-label">{label}</span>
            </div>
          );
        })}
      </div>

      <button className="upgrade-button" type="button">
        Upgrade to Premium <Sparkles size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

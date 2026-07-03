import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Lock, ShoppingCart, Soup, Sparkles, Stethoscope } from "lucide-react";

const tiles = [
  { label: "daily.cooking", icon: Soup, to: "/cooking", locked: false },
  { label: "daily.doctor", icon: Stethoscope, to: "/daily-life/doctor-visit", locked: false },
  { label: "daily.grocery", icon: ShoppingCart, to: "/daily-life/grocery-store", locked: false },
  { label: "daily.school", icon: GraduationCap, to: "/daily-life/parent-teacher-meeting", locked: false }
];

export default function DailyLifeHub() {
  const { t } = useTranslation();

  return (
    <div className="page-stack daily-page">
      <h1 className="daily-title">{t("daily.title")}</h1>

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
                  <span className="daily-lock" aria-label={t("daily.premium")}>
                    <Lock size={16} aria-hidden="true" />
                  </span>
                )}
              </Card>
              <span className="daily-label">{t(label)}</span>
            </div>
          );
        })}
      </div>

      <button className="upgrade-button" type="button">
        {t("daily.upgrade")} <Sparkles size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

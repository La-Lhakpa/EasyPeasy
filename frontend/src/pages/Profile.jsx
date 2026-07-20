import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, CircleHelp, Flame, NotebookText, Pencil, Soup, Sparkles } from "lucide-react";
import userProgress from "../data/userProgress.json";
import { getStats, useProgress } from "../lib/progress.js";
import { useProfile } from "../lib/profile.js";
import { useAuth } from "../lib/auth.jsx";

// The languages EasyPeasy is fully translated into, shown in their native script.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ne", label: "नेपाली" },
  { code: "bn", label: "বাংলা" },
];

// The single character shown inside the avatar ring. If the name already
// contains Devanagari (e.g. "रितिका"), keep that script's first letter;
// otherwise fall back to the first Latin initial, uppercased.
function avatarInitial(name) {
  const clean = (name || "").trim();
  if (!clean) return "?";
  const devanagari = clean.match(/[ऀ-ॿ]/);
  return devanagari ? devanagari[0] : clean[0].toUpperCase();
}

export default function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const progress = useProgress();
  const profile = useProfile();
  const stats = getStats(progress);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("easypeasy:language", code);
    setLangOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/welcome", { replace: true });
  };

  const displayName = user?.name || (userProgress.name === "Shila" ? "Ritika Deb" : userProgress.name);

  return (
    <div className="page-stack profile2-page">
      <h1 className="profile2-title">{t("profile.title")}</h1>

      <div className="profile2-avatar" aria-hidden="true">
        <span className="profile2-avatar-initial">{avatarInitial(displayName)}</span>
      </div>
      <p className="profile2-name">{displayName}</p>
      {profile.completed && (
        <p className="profile2-level">
          {t(`profile.level.${profile.level}`)}
          {profile.home_language ? ` · ${profile.home_language}` : ""}
        </p>
      )}

      <section className="stat-row">
        <div className="stat-chip">
          <Flame size={20} aria-hidden="true" />
          <strong>{stats.streak}</strong>
          <span>{t("profile.dayStreak")}</span>
        </div>
        <div className="stat-chip">
          <NotebookText size={20} aria-hidden="true" />
          <strong>{stats.phrasesLearned}</strong>
          <span>{t("profile.phrases")}</span>
        </div>
        <div className="stat-chip">
          <Soup size={20} aria-hidden="true" />
          <strong>{stats.recipesCompleted}</strong>
          <span>{t("profile.recipes")}</span>
        </div>
      </section>

      <nav className="profile2-menu">
        <span className="profile2-accent" aria-hidden="true" />

        {/* The one primary action keeps the solid maroon button treatment. */}
        <button className="profile2-edit" type="button" onClick={() => navigate("/assessment")}>
          <span>{t("profile.editProfile")}</span>
          <Pencil size={20} aria-hidden="true" />
        </button>

        {/* Everything else is a plain, equally-quiet list row with a divider. */}
        <div className="profile2-list">
          <div className="profile2-row-group">
            <button
              className="profile2-list-row"
              type="button"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((open) => !open)}
            >
              <span>{t("profile.changeLanguage")}</span>
              <ChevronDown size={20} aria-hidden="true" className={langOpen ? "flip" : ""} />
            </button>
            {langOpen && (
              <ul className="profile2-dropdown">
                {LANGUAGES.map(({ code, label }) => (
                  <li key={code}>
                    <button
                      type="button"
                      className={i18n.language === code ? "selected" : ""}
                      onClick={() => changeLanguage(code)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="profile2-list-row" type="button" onClick={() => navigate("/word-bank")}>
            <span>{t("profile.wordBank")}</span>
            <NotebookText size={20} aria-hidden="true" />
          </button>

          <button className="profile2-list-row" type="button" onClick={() => {/* TODO: Help screen */}}>
            <span>{t("profile.help")}</span>
            <CircleHelp size={20} aria-hidden="true" />
          </button>

          <button className="profile2-list-row" type="button" onClick={() => navigate("/about")}>
            <span>{t("profile.about")}</span>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <button className="upgrade-button" type="button">
          {t("daily.upgrade")} <Sparkles size={18} aria-hidden="true" />
        </button>
        
        {/* Sign out is demoted to a plain text link so it can't read as a peer
            of the actions above. */}
        <button className="profile2-signout-link" type="button" onClick={handleSignOut}>
          {t("profile.signOut")}
        </button>
      </nav>
    </div>
  );
}

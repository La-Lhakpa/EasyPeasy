import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, CircleHelp, Flame, Info, LogOut, NotebookText, Pencil, Soup, UserRound } from "lucide-react";
import userProgress from "../data/userProgress.json";
import { getStats, useProgress } from "../lib/progress.js";
import { useAuth } from "../lib/auth.jsx";

// The languages EasyPeasy is fully translated into, shown in their native script.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ne", label: "नेपाली" },
  { code: "bn", label: "বাংলা" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const progress = useProgress();
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
        <UserRound size={64} strokeWidth={2} />
      </div>
      <p className="profile2-name">{displayName}</p>

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
        <button className="profile2-row" type="button" onClick={() => {/* TODO: Edit Profile screen */}}>
          <span>{t("profile.editProfile")}</span>
          <Pencil size={20} aria-hidden="true" />
        </button>

        <div className="profile2-row-group">
          <button
            className="profile2-row"
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

        <button className="profile2-row" type="button" onClick={() => navigate("/word-bank")}>
          <span>{t("profile.wordBank")}</span>
          <NotebookText size={20} aria-hidden="true" />
        </button>

        <button className="profile2-row" type="button" onClick={() => {/* TODO: Help screen */}}>
          <span>{t("profile.help")}</span>
          <CircleHelp size={20} aria-hidden="true" />
        </button>

        <button className="profile2-row" type="button" onClick={() => navigate("/about")}>
          <span>{t("profile.about")}</span>
          <Info size={20} aria-hidden="true" />
        </button>

        <button className="profile2-row signout" type="button" onClick={handleSignOut}>
          <span>{t("profile.signOut")}</span>
          <LogOut size={20} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

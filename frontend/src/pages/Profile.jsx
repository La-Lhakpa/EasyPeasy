import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, CircleHelp, Info, NotebookText, Pencil, UserRound } from "lucide-react";
import userProgress from "../data/userProgress.json";

const LANGUAGES = ["English", "Hindi", "Bangla", "Nepali"];

export default function Profile() {
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState("English");

  return (
    <div className="page-stack profile2-page">
      <h1 className="profile2-title">Profile</h1>

      <div className="profile2-avatar" aria-hidden="true">
        <UserRound size={64} strokeWidth={2} />
      </div>
      <p className="profile2-name">{userProgress.name === "Shila" ? "Ritika Deb" : userProgress.name}</p>

      <nav className="profile2-menu">
        <button className="profile2-row" type="button" onClick={() => {/* TODO: Edit Profile screen */}}>
          <span>Edit Profile</span>
          <Pencil size={20} aria-hidden="true" />
        </button>

        <div className="profile2-row-group">
          <button
            className="profile2-row"
            type="button"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((open) => !open)}
          >
            <span>Change Language</span>
            <ChevronDown size={20} aria-hidden="true" className={langOpen ? "flip" : ""} />
          </button>
          {langOpen && (
            <ul className="profile2-dropdown">
              {LANGUAGES.map((lang) => (
                <li key={lang}>
                  <button
                    type="button"
                    className={language === lang ? "selected" : ""}
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                  >
                    {lang}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="profile2-row" type="button" onClick={() => navigate("/word-bank")}>
          <span>Word Bank</span>
          <NotebookText size={20} aria-hidden="true" />
        </button>

        <button className="profile2-row" type="button" onClick={() => {/* TODO: Help screen */}}>
          <span>Help</span>
          <CircleHelp size={20} aria-hidden="true" />
        </button>

        <button className="profile2-row" type="button" onClick={() => navigate("/about")}>
          <span>About Us</span>
          <Info size={20} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

import { BookMarked, CircleHelp, Info, SlidersHorizontal, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import languages from "../data/languages.json";
import userProgress from "../data/userProgress.json";

export default function Profile() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Your Practice"
        subtitle="Small settings to make EasyPeasy feel comfortable."
      />

      <section className="profile-card">
        <div className="profile-photo" aria-hidden="true">S</div>
        <div>
          <h2>{userProgress.name}</h2>
          <p>{userProgress.language} speaker learning everyday English.</p>
        </div>
      </section>

      <section>
        <SectionHeader title="Preferences" />
        <div className="settings-list">
          <label className="setting-row">
            <span>Language</span>
            <select defaultValue="ne" aria-label="Language">
              {languages.map((language) => (
                <option key={language.code} value={language.code}>{language.label}</option>
              ))}
            </select>
          </label>
          <label className="setting-row">
            <span>Speech Speed</span>
            <select defaultValue="slow" aria-label="Speech Speed">
              <option value="slow">Slow and gentle</option>
              <option value="normal">Normal</option>
              <option value="very-slow">Very slow</option>
            </select>
          </label>
          <label className="setting-row">
            <span>NaanSense Voice</span>
            <select defaultValue="warm" aria-label="AI Voice">
              <option value="warm">Warm female voice</option>
              <option value="calm">Calm male voice</option>
              <option value="bright">Bright friendly voice</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <SectionHeader title="Account" />
        <div className="profile-links">
          <Link to="/phrase-bank"><BookMarked size={20} aria-hidden="true" /> Saved Phrases</Link>
          <a href="#help"><CircleHelp size={20} aria-hidden="true" /> Help & Support</a>
          <a href="#about"><Info size={20} aria-hidden="true" /> About EasyPeasy</a>
          <a href="#settings"><SlidersHorizontal size={20} aria-hidden="true" /> Practice Settings</a>
          <a href="#voice"><Volume2 size={20} aria-hidden="true" /> Voice Preview</a>
        </div>
      </section>
    </div>
  );
}

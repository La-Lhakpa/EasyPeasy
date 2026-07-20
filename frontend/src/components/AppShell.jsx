import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import BottomNavigation from "./BottomNavigation.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

export default function AppShell() {
  const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState(false);
  const { i18n } = useTranslation();

  // Pre-login screens (Welcome/Sign In/Sign Up) always render in English
  // (see App.jsx). Once the learner reaches the authenticated app, restore
  // whatever language they last chose on this device.
  useEffect(() => {
    const saved = localStorage.getItem("easypeasy:language");
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
    // Only run once, when the authenticated shell first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLanguageLabel = () => {
    const labels = { en: "English", ne: "नेपाली", bn: "বাংলা" };
    return labels[i18n.language] || "English";
  };

  return (
    <div className="app-shell">
      <div className="floral-top" aria-hidden="true" />
      <button
        className="lang-pill"
        type="button"
        onClick={() => setIsLanguageSwitcherOpen(true)}
        aria-label="Change language"
      >
        <Globe size={14} aria-hidden="true" />
        {getLanguageLabel()}
      </button>
      <LanguageSwitcher
        isOpen={isLanguageSwitcherOpen}
        onClose={() => setIsLanguageSwitcherOpen(false)}
      />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}

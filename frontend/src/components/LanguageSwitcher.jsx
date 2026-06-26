import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export default function LanguageSwitcher({ isOpen, onClose }) {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", label: "English", nativeName: "English" },
    { code: "ne", label: "नेपाली", nativeName: "Nepali" },
    { code: "bn", label: "বাংলা", nativeName: "Bengali" },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("easypeasy:language", langCode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="language-switcher-overlay">
      <div className="language-switcher-modal">
        <div className="language-switcher-header">
          <h2>{i18n.t("lang.select")}</h2>
          <button
            className="close-button"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <div className="language-options">
          {languages.map(({ code, label, nativeName }) => (
            <button
              key={code}
              className={`language-option ${i18n.language === code ? "active" : ""}`}
              onClick={() => handleLanguageChange(code)}
              type="button"
            >
              <span className="language-label">{label}</span>
              <span className="language-native">({nativeName})</span>
              {i18n.language === code && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

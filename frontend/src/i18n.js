import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import nepaliTranslations from './locales/ne.json';
import bengaliTranslations from './locales/bn.json';

const resources = {
  en: { translation: enTranslations },
  ne: { translation: nepaliTranslations },
  bn: { translation: bengaliTranslations },
};

const savedLanguage = localStorage.getItem('easypeasy:language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    // Our translation keys are flat strings that contain dots (e.g.
    // "home.welcomeBack"). Disable the nesting/namespace separators so i18next
    // matches those keys literally instead of trying to traverse them.
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

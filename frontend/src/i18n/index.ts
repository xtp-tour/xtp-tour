import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import moment from 'moment';

// Load moment locales
import '../utils/localeLoader';

// Import translation files
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import fr from './locales/fr/translation.json';
import pl from './locales/pl/translation.json';
import ru from './locales/ru/translation.json';

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  pl: {
    translation: pl,
  },
  ru: {
    translation: ru,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })
  .then(() => {
    if (import.meta.env.DEV) {
      console.log('i18next initialized with language:', i18n.language);
      console.log('Available languages:', Object.keys(resources));
    }
  });

// Set moment.js locale when language changes
const setMomentLocale = (lng: string) => {
  // Map i18n language codes to moment locale codes
  const localeMap: Record<string, string> = { en: 'en', es: 'es', fr: 'fr', pl: 'pl', ru: 'ru' };
  const momentLocale = localeMap[lng] || 'en';
  
  // Try to set the moment locale, falling back to English if not available
  const availableLocales = moment.locales();
  if (availableLocales.includes(momentLocale)) {
    moment.locale(momentLocale);
    if (import.meta.env.DEV) {
      console.log('Moment locale set to:', momentLocale);
    }
  } else {
    moment.locale('en');
    if (import.meta.env.DEV) {
      console.warn(`Moment locale '${momentLocale}' not available, using English fallback`);
    }
  }
};

// Set moment.js locale when language changes
i18n.on('languageChanged', (lng) => {
  setMomentLocale(lng);
});

// Set initial moment locale
setMomentLocale(i18n.language || 'en');

export default i18n;
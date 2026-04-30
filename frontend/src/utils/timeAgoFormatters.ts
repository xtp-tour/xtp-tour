import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

// Import language strings for supported languages
import deStrings from 'react-timeago/lib/language-strings/de';
import enStrings from 'react-timeago/lib/language-strings/en';
import esStrings from 'react-timeago/lib/language-strings/es';
import frStrings from 'react-timeago/lib/language-strings/fr';
import plStrings from 'react-timeago/lib/language-strings/pl';
import ruStrings from 'react-timeago/lib/language-strings/ru';

// Build formatters for each supported language
const formatters = {
  de: buildFormatter(deStrings),
  en: buildFormatter(enStrings),
  es: buildFormatter(esStrings),
  fr: buildFormatter(frStrings),
  pl: buildFormatter(plStrings),
  ru: buildFormatter(ruStrings),
};

// Get formatter for current language with fallback to English
export const getTimeAgoFormatter = (language: string) => {
  const lang = language.split('-')[0]; // Handle cases like 'en-GB' -> 'en'
  return formatters[lang as keyof typeof formatters] || formatters.en;
};

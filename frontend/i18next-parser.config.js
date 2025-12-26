export default {
  locales: ['en', 'es', 'fr', 'pl', 'ru'],

  // Where translation files are located
  output: 'src/i18n/locales/$LOCALE/translation.json',

  // Where to look for translation keys in code
  input: ['src/**/*.{ts,tsx}'],

  // Keep existing translations (don't remove keys not found in code)
  keepRemoved: true,

  // Don't create backup files
  createOldCatalogs: false,

  // Formatting
  indentation: 2,
  lineEnding: 'lf',
  sort: true,

  // Key separators
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultNamespace: 'translation',

  // Default value for new keys
  defaultValue: (locale, namespace, key) => {
    return locale === 'en' ? '' : `[MISSING: ${key}]`;
  },

  // i18next function names to look for
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: [
      {
        lexer: 'JsxLexer',
        attr: 'i18nKey',
      },
    ],
  },

  // Trans component settings
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'b', 'em'],
};

module.exports = {
  locales: ['en', 'es', 'fr', 'pl', 'ru'],

  // Where to write the translation files
  output: 'src/i18n/locales/$LOCALE/translation.json',

  // Where to look for translation keys in code
  input: ['src/**/*.{ts,tsx}'],

  // Use the existing translation files as source
  // Don't create new keys from code scanning - we manage keys manually
  createOldCatalogs: false,

  // Keep existing translations
  keepRemoved: true,

  // Formatting
  indentation: 2,
  lineEnding: 'lf',
  sort: true,

  // Key separator (for nested keys like "landing.hero.title")
  keySeparator: '.',
  namespaceSeparator: ':',

  // Default namespace
  defaultNamespace: 'translation',

  // Fail on warnings (missing keys)
  failOnWarnings: false,
  failOnUpdate: false,

  // i18next options
  i18nextOptions: {
    compatibilityJSON: 'v4',
  },

  // Lexers for different file types
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },
};

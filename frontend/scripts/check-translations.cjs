#!/usr/bin/env node

/**
 * Translation completeness checker
 * Compares all locale files against the base locale (English) to find missing keys.
 *
 * Usage: node scripts/check-translations.js [--fix]
 *
 * Options:
 *   --fix  Add missing keys with empty strings (for translators to fill in)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const BASE_LOCALE = 'en';
const FIX_MODE = process.argv.includes('--fix');

// Pluralization suffixes that are language-specific (not missing keys)
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function isPluralVariant(key, baseKey) {
  return PLURAL_SUFFIXES.some(suffix => key === baseKey + suffix);
}

function isBasePluralKey(key, allKeys) {
  return PLURAL_SUFFIXES.some(suffix => allKeys.includes(key + suffix));
}

// Read base locale
const basePath = path.join(LOCALES_DIR, BASE_LOCALE, 'translation.json');
const baseTranslation = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const baseKeys = getAllKeys(baseTranslation);
const baseKeySet = new Set(baseKeys);

console.log(`\n📋 Translation Completeness Check`);
console.log(`   Base locale: ${BASE_LOCALE} (${baseKeys.length} keys)\n`);

// Get all locales
const locales = fs.readdirSync(LOCALES_DIR)
  .filter(f => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory())
  .filter(f => f !== BASE_LOCALE);

let totalMissing = 0;
let totalExtra = 0;
const results = [];

for (const locale of locales) {
  const localePath = path.join(LOCALES_DIR, locale, 'translation.json');

  if (!fs.existsSync(localePath)) {
    console.error(`❌ ${locale}: translation.json not found`);
    totalMissing += baseKeys.length;
    continue;
  }

  const translation = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const localeKeys = getAllKeys(translation);
  const localeKeySet = new Set(localeKeys);

  // Find missing keys (in base but not in locale)
  const missing = baseKeys.filter(k => {
    if (localeKeySet.has(k)) return false;
    // Check if this locale has plural variants instead
    if (isBasePluralKey(k, localeKeys)) return false;
    return true;
  });

  // Find extra keys (in locale but not in base) - excluding valid plural variants
  const extra = localeKeys.filter(k => {
    if (baseKeySet.has(k)) return false;
    // Check if it's a valid plural variant of a base key
    const baseKey = k.replace(/_(?:zero|one|two|few|many|other)$/, '');
    if (baseKeySet.has(baseKey)) return false;
    return true;
  });

  results.push({ locale, missing, extra, total: localeKeys.length });
  totalMissing += missing.length;
  totalExtra += extra.length;

  // Fix mode: add missing keys
  if (FIX_MODE && missing.length > 0) {
    for (const key of missing) {
      setNestedValue(translation, key, `[TODO: ${key}]`);
    }
    fs.writeFileSync(localePath, JSON.stringify(translation, null, 2) + '\n');
    console.log(`🔧 ${locale}: Added ${missing.length} missing keys with placeholders`);
  }
}

// Print results
for (const { locale, missing, extra, total } of results) {
  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ ${locale}: Complete (${total} keys)`);
  } else {
    if (missing.length > 0) {
      console.log(`❌ ${locale}: Missing ${missing.length} keys:`);
      missing.slice(0, 10).forEach(k => console.log(`      - ${k}`));
      if (missing.length > 10) {
        console.log(`      ... and ${missing.length - 10} more`);
      }
    }
    if (extra.length > 0) {
      console.log(`⚠️  ${locale}: ${extra.length} extra keys (review if intentional):`);
      extra.slice(0, 5).forEach(k => console.log(`      - ${k}`));
      if (extra.length > 5) {
        console.log(`      ... and ${extra.length - 5} more`);
      }
    }
  }
}

// Summary
console.log(`\n${'─'.repeat(50)}`);
if (totalMissing === 0) {
  console.log(`✅ All translations complete!`);
} else {
  console.log(`❌ Total missing: ${totalMissing} keys across ${locales.length} locales`);
  if (!FIX_MODE) {
    console.log(`   Run with --fix to add placeholders for missing keys`);
  }
}

if (totalExtra > 0) {
  console.log(`⚠️  Total extra: ${totalExtra} keys (may be intentional pluralization)`);
}

console.log('');

// Exit with error if missing keys (for CI)
process.exit(totalMissing > 0 ? 1 : 0);

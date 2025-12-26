#!/bin/bash
set -e

# Store the current state of translation files
LOCALE_DIR="src/i18n/locales"
TEMP_DIR=$(mktemp -d)

echo "Checking i18n translations..."

# Copy current translation files to temp directory
cp -r "$LOCALE_DIR" "$TEMP_DIR/"

# Run i18next parser
i18next 'src/**/*.{ts,tsx}'

# Check if any translation files were modified
if ! diff -r "$LOCALE_DIR" "$TEMP_DIR/locales" > /dev/null 2>&1; then
  echo ""
  echo "❌ ERROR: Translation files are out of sync!"
  echo ""
  echo "Differences found:"
  diff -r "$LOCALE_DIR" "$TEMP_DIR/locales" || true
  echo ""
  echo "Please run 'pnpm i18n:sync' to update translation files."

  # Restore original files
  rm -rf "$LOCALE_DIR"
  mv "$TEMP_DIR/locales" "$(dirname "$LOCALE_DIR")/"
  rm -rf "$TEMP_DIR"

  exit 1
fi

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ All translation files are up to date!"
exit 0


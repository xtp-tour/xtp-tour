import moment from 'moment';

// Dynamically load moment locales without TypeScript type checking
const loadMomentLocales = async () => {
  const locales = ['es', 'fr', 'pl'];

  for (const locale of locales) {
    try {
      // Use dynamic import with string template to avoid TypeScript errors

      await import(/* @vite-ignore */ `moment/locale/${locale}`);
      if (import.meta.env.DEV) {
        console.log(`Moment locale ${locale} loaded successfully`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`Failed to load moment locale ${locale}:`, error);
      }
    }
  }

  if (import.meta.env.DEV) {
    console.log('Available moment locales:', moment.locales());
  }
};

// Load locales immediately
loadMomentLocales();

export { loadMomentLocales };
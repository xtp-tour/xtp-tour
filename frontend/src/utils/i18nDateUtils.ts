import moment from 'moment';
import i18n from '../i18n';

// Define TFunction type locally since it's not exported from react-i18next
type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Format session duration from minutes to a human-readable string with i18n support
 * 
 * @param minutes Duration in minutes
 * @param t Translation function from useTranslation hook
 * @returns Formatted duration string
 */
export const formatDurationI18n = (minutes: number, t: TFunction): string => {
  if (!minutes) return '';
  
  if (minutes < 60) {
    // For non-standard minute durations, fall back to minute display
    if (minutes % 30 !== 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    // For 30 minutes, show as "½ hour" - this would need specific translation
    if (minutes === 30) {
      return '½ hour'; // This could be translated specifically if needed
    }
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    // Whole hours
    if (hours === 1) {
      return t('durations.hour');
    } else {
      return t('durations.hours', { count: hours });
    }
  } else if (remainingMinutes === 30) {
    // Half hours (e.g., 1½ hours)
    if (hours === 1) {
      return t('durations.hourAndHalf');
    } else {
      return t('durations.hoursAndHalf', { count: hours });
    }
  } else {
    // If not divisible by 30, show hours and minutes (fallback)
    return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
  }
};

/**
 * Format time slot for display in UI with locale awareness, converting from UTC to local
 * 
 * @param utcTimeSlot UTC ISO string
 * @returns Formatted time string using current i18n locale
 */
export const formatTimeSlotLocalized = (utcTimeSlot: string): string => {
  const localDate = moment.utc(utcTimeSlot).local();
  const currentLocale = i18n.language === 'en' ? 'en' : 
                       i18n.language === 'es' ? 'es' : 
                       i18n.language === 'fr' ? 'fr' : 
                       i18n.language === 'pl' ? 'pl' : 'en';
  
  // Use current i18n locale for formatting
  return localDate.locale(currentLocale).format('ddd, MMM D @ LT');
};

/**
 * Format UTC ISO timestamp to local time with locale support
 * 
 * @param isoString UTC ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)
 * @param format Optional format string for moment
 * @returns Formatted date string in local time using current i18n locale
 */
export const formatUtcToLocalI18n = (isoString: string, format?: string): string => {
  const momentDate = moment.utc(isoString).local();
  const currentLocale = i18n.language === 'en' ? 'en' : 
                       i18n.language === 'es' ? 'es' : 
                       i18n.language === 'fr' ? 'fr' : 
                       i18n.language === 'pl' ? 'pl' : 'en';
  
  momentDate.locale(currentLocale);
  
  return format ? momentDate.format(format) : momentDate.format('YYYY-MM-DD HH:mm');
};
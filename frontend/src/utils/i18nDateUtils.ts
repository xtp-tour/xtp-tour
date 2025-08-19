import moment from 'moment';
import i18n from '../i18n';

// Define TFunction type locally since it's not exported from react-i18next
type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Get the current locale for date formatting
 */
const getCurrentLocale = (): string => {
  return i18n.language || 'en';
};

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
 * Uses native Intl.DateTimeFormat for proper localization
 * 
 * @param utcTimeSlot UTC ISO string
 * @returns Formatted time string using current i18n locale
 */
export const formatTimeSlotLocalized = (utcTimeSlot: string): string => {
  const localDate = moment.utc(utcTimeSlot).local().toDate();
  const locale = getCurrentLocale();
  
  // Format date part (weekday, month, day) using Intl
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  // Format time part using Intl - this automatically uses the locale's preferred format
  // (24-hour for most European locales including Polish, 12-hour for US English)
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false // Force 24-hour format for consistency across locales
  });
  
  const datePart = dateFormatter.format(localDate);
  const timePart = timeFormatter.format(localDate);
  
  return `${datePart} @ ${timePart}`;
};

/**
 * Format UTC ISO timestamp to local time with locale support
 * Uses native Intl.DateTimeFormat for proper localization
 * 
 * @param isoString UTC ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)
 * @param options Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string in local time using current i18n locale
 */
export const formatUtcToLocalI18n = (isoString: string, options?: Intl.DateTimeFormatOptions): string => {
  const localDate = moment.utc(isoString).local().toDate();
  const locale = getCurrentLocale();
  
  // Default format: YYYY-MM-DD HH:mm equivalent using Intl
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formatOptions = options || defaultOptions;
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  
  return formatter.format(localDate);
};

/**
 * Format time only with locale support using native Intl API
 * 
 * @param utcTimeSlot UTC ISO string or moment object or Date
 * @returns Formatted time string using current i18n locale
 */
export const formatTimeOnlyLocalized = (utcTimeSlot: string | moment.Moment | Date): string => {
  let date: Date;
  
  if (typeof utcTimeSlot === 'string') {
    date = moment.utc(utcTimeSlot).local().toDate();
  } else if (moment.isMoment(utcTimeSlot)) {
    date = utcTimeSlot.toDate();
  } else {
    date = utcTimeSlot;
  }
  
  const locale = getCurrentLocale();
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false // Force 24-hour format for consistency
  });
  
  return formatter.format(date);
};

/**
 * Format date only with locale support using native Intl API
 * 
 * @param date Date string, moment object, or Date object
 * @returns Formatted date string using current i18n locale
 */
export const formatDateOnlyLocalized = (date: string | moment.Moment | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = moment(date).toDate();
  } else if (moment.isMoment(date)) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  const locale = getCurrentLocale();
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  return formatter.format(dateObj);
};

/**
 * Format month and day only with locale support using native Intl API
 * 
 * @param date Date string, moment object, or Date object
 * @returns Formatted month and day string using current i18n locale (e.g., "Dec 25")
 */
export const formatMonthDayLocalized = (date: string | moment.Moment | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = moment(date).toDate();
  } else if (moment.isMoment(date)) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  const locale = getCurrentLocale();
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric'
  });
  
  return formatter.format(dateObj);
};

/**
 * Format date and time range with locale support using native Intl API
 * 
 * @param startTime Start time (moment object, Date, or ISO string)
 * @param endTime End time (moment object, Date, or ISO string)
 * @returns Formatted date and time range string
 */
export const formatDateTimeRangeLocalized = (
  startTime: moment.Moment | Date | string, 
  endTime: moment.Moment | Date | string
): string => {
  let startDate: Date;
  let endDate: Date;
  
  // Convert inputs to Date objects
  if (typeof startTime === 'string') {
    startDate = moment(startTime).toDate();
  } else if (moment.isMoment(startTime)) {
    startDate = startTime.toDate();
  } else {
    startDate = startTime;
  }
  
  if (typeof endTime === 'string') {
    endDate = moment(endTime).toDate();
  } else if (moment.isMoment(endTime)) {
    endDate = endTime.toDate();
  } else {
    endDate = endTime;
  }
  
  const locale = getCurrentLocale();
  
  // Check if same day
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  
  if (startMoment.isSame(endMoment, 'day')) {
    // Same day: "Mon, Dec 25 • 14:00–16:00"
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    
    const datePart = dateFormatter.format(startDate);
    const startTime = timeFormatter.format(startDate);
    const endTime = timeFormatter.format(endDate);
    
    return `${datePart} • ${startTime}–${endTime}`;
  } else {
    // Different days: "Mon, Dec 25 • 14:00–Tue, Dec 26 • 16:00"
    const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    
    const startFormatted = dateTimeFormatter.format(startDate);
    const endFormatted = dateTimeFormatter.format(endDate);
    
    return `${startFormatted}–${endFormatted}`;
  }
};
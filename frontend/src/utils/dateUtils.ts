import moment from 'moment';
import { compressTimeSlots } from './timeSlotCompression';

// Interface for time slot - keeping it minimal for utils
interface TimeSlot {
  date: moment.Moment;
}

// Translation function type
type TranslationFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Format UTC ISO timestamp to local time
 * 
 * @param isoString UTC ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)
 * @param format Optional format string for moment
 * @returns Formatted date string in local time
 */
export const formatUtcToLocal = (isoString: string, format?: string): string => {
  const momentDate = moment.utc(isoString).local();
  return format ? momentDate.format(format) : momentDate.format('YYYY-MM-DD HH:mm');
};

/**
 * Format local time to UTC ISO string
 * 
 * @param localDate Local date object or string
 * @returns UTC ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)
 */
export const formatLocalToUtc = (localDate: Date | string): string => {
  return moment(localDate).utc().toISOString();
};

/**
 * Format time slot for display in UI, converting from UTC to local
 * 
 * @param utcTimeSlot UTC ISO string
 * @returns Formatted time string (e.g. "Mon, Dec 25 @ 2:00 PM")
 */
export const formatTimeSlot = (utcTimeSlot: string): string => {
  const localDate = moment.utc(utcTimeSlot).local();
  return localDate.format('ddd, MMM D @ LT');
};

/**
 * Format session duration from minutes to a human-readable string
 * 
 * @param minutes Duration in minutes
 * @returns Formatted duration string (e.g. "1 hour", "1½ hours", "45 minutes")
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes) return '';
  
  if (minutes < 60) {
    // If not divisible by 30, show in minutes
    if (minutes % 30 !== 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    
    // For 30 minutes, show as "½ hour"
    if (minutes === 30) {
      return '½ hour';
    }
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    // Whole hours
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (remainingMinutes === 30) {
    // Half hours (e.g., 1½ hours)
    return `${hours}½ hour${hours === 1 ? '' : 's'}`;
  } else {
    // If not divisible by 30, show hours and minutes
    return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
  }
};

/**
 * Format time slots summary for display in event headers
 * Uses smart compression to show ranges and time-of-day generalizations
 * 
 * @param timeSlots Array of time slots with moment dates
 * @param t Translation function
 * @returns Formatted time slots summary string
 */
export const formatTimeSlotSummary = (timeSlots: TimeSlot[], t: TranslationFunction): string => {
  return compressTimeSlots(timeSlots, t);
}; 
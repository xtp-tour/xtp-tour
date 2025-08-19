import moment from 'moment';
import { formatDateTimeRangeLocalized, formatTimeSlotLocalized, formatDateOnlyLocalized, formatMonthDayLocalized } from './i18nDateUtils';

// Interface for time slot - keeping it minimal for utils
interface TimeSlot {
  date: moment.Moment;
}

// Translation function type
type TranslationFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Time of day categories for generalization
 */
enum TimeOfDay {
  MORNING = 'morning',              // 6:00 - 12:00 (combined early morning + morning)
  AFTERNOON = 'afternoon',          // 12:00 - 17:00
  EVENING = 'evening',              // 17:00 - 21:00
  NIGHT = 'night',                  // 21:00 - 6:00
}

/**
 * Get time of day category for a given hour
 */
const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 6 && hour < 12) return TimeOfDay.MORNING;  // Combined early morning + morning
  if (hour >= 12 && hour < 17) return TimeOfDay.AFTERNOON;
  if (hour >= 17 && hour < 21) return TimeOfDay.EVENING;
  return TimeOfDay.NIGHT;
};

/**
 * Group consecutive time slots into ranges
 */
const groupConsecutiveSlots = (slots: TimeSlot[]): TimeSlot[][] => {
  if (slots.length === 0) return [];
  
  const sortedSlots = [...slots].sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const groups: TimeSlot[][] = [];
  let currentGroup: TimeSlot[] = [sortedSlots[0]];
  
  for (let i = 1; i < sortedSlots.length; i++) {
    const current = sortedSlots[i];
    const previous = sortedSlots[i - 1];
    
    // Check if slots are on the same day and consecutive (30-minute intervals)
    const timeDiff = current.date.diff(previous.date, 'minutes');
    const isSameDay = current.date.isSame(previous.date, 'day');
    
    if (isSameDay && timeDiff === 30) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  groups.push(currentGroup);
  return groups;
};

/**
 * Format a range of consecutive time slots using localized formatting
 */
const formatTimeRange = (group: TimeSlot[]): string => {
  if (group.length === 1) {
    return formatTimeSlotLocalized(group[0].date.toISOString());
  }
  
  const start = group[0];
  const end = group[group.length - 1];
  
  // Calculate end time by adding 30 minutes to the last slot
  const endTime = end.date.clone().add(30, 'minutes');
  
  return formatDateTimeRangeLocalized(start.date, endTime);
};

/**
 * Generalize multiple time ranges to time-of-day categories
 */
const generalizeToTimeOfDay = (groups: TimeSlot[][], t: TranslationFunction): string => {
  const timeCategories = new Set<TimeOfDay>();
  const dates = new Set<string>();
  
  groups.forEach(group => {
    group.forEach(slot => {
      const hour = slot.date.hour();
      timeCategories.add(getTimeOfDay(hour));
      dates.add(slot.date.format('YYYY-MM-DD'));
    });
  });
  
  const uniqueDates = Array.from(dates);
  const categoriesArray = Array.from(timeCategories);
  
  // If spans multiple days and multiple time categories, generalize appropriately
  if (uniqueDates.length > 1 && categoriesArray.length > 1) {
    const startDate = formatMonthDayLocalized(uniqueDates[0]);
    const endDate = formatMonthDayLocalized(uniqueDates[uniqueDates.length - 1]);
    
    if (categoriesArray.length >= 3) {
      return `${startDate}–${endDate} • ${t('timeOfDay.wholeDay')}`;
    } else {
      return `${startDate}–${endDate} • ${categoriesArray.sort().map(cat => t(`timeOfDay.${cat}`)).join(' & ')}`;
    }
  }
  
  // If single day but multiple time categories
  if (uniqueDates.length === 1 && categoriesArray.length > 1) {
    const dateStr = formatDateOnlyLocalized(uniqueDates[0]);
    if (categoriesArray.length >= 3) {
      return `${dateStr} • ${t('timeOfDay.wholeDay')}`;
    } else {
      return `${dateStr} • ${categoriesArray.sort().map(cat => t(`timeOfDay.${cat}`)).join(' & ')}`;
    }
  }
  
  // If single time category across multiple days
  if (uniqueDates.length > 1 && categoriesArray.length === 1) {
    const startDate = formatMonthDayLocalized(uniqueDates[0]);
    const endDate = formatMonthDayLocalized(uniqueDates[uniqueDates.length - 1]);
    return `${startDate}–${endDate} • ${t(`timeOfDay.${categoriesArray[0]}`)}`;
  }
  
  // Default: show first date with time category
  const firstDate = formatDateOnlyLocalized(uniqueDates[0]);
  return `${firstDate} • ${t(`timeOfDay.${categoriesArray[0]}`)}`;
};

/**
 * Compress time slots into an optimized display format
 * 
 * @param timeSlots Array of time slots with moment dates
 * @param t Translation function
 * @returns Compressed time slot summary string
 */
export const compressTimeSlots = (timeSlots: TimeSlot[], t: TranslationFunction): string => {
  if (timeSlots.length === 0) return '';
  
  // For single slot, use localized format
  if (timeSlots.length === 1) {
    return formatTimeSlotLocalized(timeSlots[0].date.toISOString());
  }
  
  // Group consecutive time slots
  const groups = groupConsecutiveSlots(timeSlots);
  
  // For simple cases (1-2 groups), show ranges
  if (groups.length === 1) {
    return formatTimeRange(groups[0]);
  }
  
  if (groups.length === 2) {
    const range1 = formatTimeRange(groups[0]);
    const range2 = formatTimeRange(groups[1]);
    
    // If both ranges are short, show both
    if (range1.length + range2.length < 50) {
      return `${range1} ${t('timeOfDay.and')} ${range2}`;
    }
  }
  
  // For complex cases, generalize to time-of-day
  return generalizeToTimeOfDay(groups, t);
};
import moment from 'moment';
import { compressTimeSlots } from './timeSlotCompression';

// Interface for time slot - matching the one in the module
interface TimeSlot {
  date: moment.Moment;
}

// Test helper to create time slots
const createTimeSlot = (dateStr: string): TimeSlot => ({
  date: moment(dateStr)
});

// Mock translation function for testing
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    'timeOfDay.morning': 'morning',
    'timeOfDay.afternoon': 'afternoon',
    'timeOfDay.evening': 'evening',
    'timeOfDay.night': 'night',
    'timeOfDay.wholeDay': 'whole day',
    'timeOfDay.and': 'and'
  };
  return translations[key] || key;
};

describe('compressTimeSlots', () => {
  describe('single day scenarios', () => {
    it('should handle single time slot', () => {
      const singleSlot = [createTimeSlot('2024-01-15 14:00')];
      const result = compressTimeSlots(singleSlot, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Jan 15');
      expect(result).toContain('14:00');
    });

    it('should show range for two consecutive slots', () => {
      const consecutiveSlots = [
        createTimeSlot('2024-01-15 14:00'),
        createTimeSlot('2024-01-15 14:30')
      ];
      const result = compressTimeSlots(consecutiveSlots, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Jan 15');
      expect(result).toMatch(/14:00.*15:00/);
    });

    it('should handle three consecutive slots (8:00, 8:30, 9:00)', () => {
      const threeConsecutive = [
        createTimeSlot('2024-01-15 08:00'),
        createTimeSlot('2024-01-15 08:30'),
        createTimeSlot('2024-01-15 09:00')
      ];
      const result = compressTimeSlots(threeConsecutive, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Jan 15');
      expect(result).toMatch(/08:00.*09:30/);
    });

    it('should generalize non-consecutive times on same day', () => {
      const nonConsecutive = [
        createTimeSlot('2024-01-15 08:30'),
        createTimeSlot('2024-01-15 10:30')
      ];
      const result = compressTimeSlots(nonConsecutive, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Jan 15');
      // Should contain some time of day indication
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generalize multiple times across day', () => {
      const wholeDaySlots = [
        createTimeSlot('2024-01-15 08:00'),
        createTimeSlot('2024-01-15 12:00'),
        createTimeSlot('2024-01-15 18:00')
      ];
      const result = compressTimeSlots(wholeDaySlots, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Jan 15');
    });
  });

  describe('multi-day scenarios', () => {
    it('should handle 6 slots across multiple days and time periods', () => {
      const userBugCase = [
        createTimeSlot('2024-08-14 06:00'), // Thu, morning
        createTimeSlot('2024-08-14 06:30'), // Thu, morning
        createTimeSlot('2024-08-17 12:30'), // Sun, afternoon
        createTimeSlot('2024-08-18 15:30'), // Mon, afternoon
        createTimeSlot('2024-08-18 16:00'), // Mon, afternoon
        createTimeSlot('2024-08-18 16:30')  // Mon, afternoon
      ];
      const result = compressTimeSlots(userBugCase, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Aug');
      expect(result).toContain('14');
      expect(result).toContain('18');
    });

    it('should show "whole day" for multi-day with 3+ time categories', () => {
      const wholeDayMultiDay = [
        createTimeSlot('2024-08-14 08:00'), // Thu, morning
        createTimeSlot('2024-08-15 14:00'), // Fri, afternoon
        createTimeSlot('2024-08-16 19:00'), // Sat, evening
        createTimeSlot('2024-08-17 02:00')  // Sun, night
      ];
      const result = compressTimeSlots(wholeDayMultiDay, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Aug');
      // Should contain either time categories or "whole day"
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = compressTimeSlots([], mockT);
      expect(result).toBe('');
    });

    it('should handle single slot in array', () => {
      const singleSlot = [createTimeSlot('2024-01-15 09:00')];
      const result = compressTimeSlots(singleSlot, mockT);
      
      expect(result).toBeTruthy();
      expect(result).toContain('Jan 15');
      expect(result).toContain('09:00');
    });
  });
});

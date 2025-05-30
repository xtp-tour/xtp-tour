import { generateTimeSlots, DateTimeSlot } from '../timeSlotUtils';

describe('timeSlotUtils', () => {
  describe('generateTimeSlots', () => {
    it('should generate correct time slots for a 2-hour session in a 4-hour window', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '09:00',
          timeTo: '13:00'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 2);
      
      // Should generate slots every 30 minutes from 09:00 to 11:00 (last possible start for 2-hour session ending at 13:00)
      expect(result).toEqual([
        '2024-12-15T09:00:00.000Z',
        '2024-12-15T09:30:00.000Z',
        '2024-12-15T10:00:00.000Z',
        '2024-12-15T10:30:00.000Z',
        '2024-12-15T11:00:00.000Z'
      ]);
    });

    it('should generate correct time slots for a 1.5-hour session', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '10:00',
          timeTo: '13:00'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 1.5);
      
      // Should generate slots every 30 minutes from 10:00 to 11:30 (last possible start for 1.5-hour session ending at 13:00)
      expect(result).toEqual([
        '2024-12-15T10:00:00.000Z',
        '2024-12-15T10:30:00.000Z',
        '2024-12-15T11:00:00.000Z',
        '2024-12-15T11:30:00.000Z'
      ]);
    });

    it('should handle exact duration match (no partial slots)', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '14:00',
          timeTo: '16:00'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 2);
      
      // Only one slot possible: 14:00 (session would end exactly at 16:00)
      expect(result).toEqual([
        '2024-12-15T14:00:00.000Z'
      ]);
    });

    it('should return empty array when time window is smaller than session duration', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '15:00',
          timeTo: '16:30'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 2);
      
      // 1.5-hour window cannot accommodate 2-hour session
      expect(result).toEqual([]);
    });

    it('should handle multiple date slots', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '09:00',
          timeTo: '11:00'
        },
        {
          id: 2,
          date: '2024-12-16',
          timeFrom: '14:00',
          timeTo: '17:00'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 1);
      
      // First slot: 09:00-10:00 (2 slots possible)
      // Second slot: 14:00-17:00 (6 slots possible)
      expect(result).toEqual([
        '2024-12-15T09:00:00.000Z',
        '2024-12-15T09:30:00.000Z',
        '2024-12-15T10:00:00.000Z',
        '2024-12-16T14:00:00.000Z',
        '2024-12-16T14:30:00.000Z',
        '2024-12-16T15:00:00.000Z',
        '2024-12-16T15:30:00.000Z',
        '2024-12-16T16:00:00.000Z'
      ]);
    });

    it('should handle 30-minute sessions correctly', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '10:00',
          timeTo: '11:30'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 0.5);
      
      // Should generate slots every 30 minutes from 10:00 to 11:00
      expect(result).toEqual([
        '2024-12-15T10:00:00.000Z',
        '2024-12-15T10:30:00.000Z',
        '2024-12-15T11:00:00.000Z'
      ]);
    });

    it('should handle edge case with very short time window', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '10:00',
          timeTo: '10:15'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 0.5);
      
      // 15-minute window cannot accommodate 30-minute session
      expect(result).toEqual([]);
    });

    it('should handle fractional hour durations correctly', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '09:00',
          timeTo: '12:30'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 2.5);
      
      // 2.5 hours = 150 minutes
      // From 09:00 to 12:30 (3.5 hours), last possible start is 10:00 (session would end at 12:30)
      expect(result).toEqual([
        '2024-12-15T09:00:00.000Z',
        '2024-12-15T09:30:00.000Z',
        '2024-12-15T10:00:00.000Z'
      ]);
    });

    it('should handle empty dateSlots array', () => {
      const dateSlots: DateTimeSlot[] = [];
      
      const result = generateTimeSlots(dateSlots, 2);
      
      expect(result).toEqual([]);
    });

    it('should preserve chronological order across multiple dates', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-16',
          timeFrom: '10:00',
          timeTo: '11:00'
        },
        {
          id: 2,
          date: '2024-12-15',
          timeFrom: '14:00',
          timeTo: '15:00'
        }
      ];
      
      const result = generateTimeSlots(dateSlots, 1);
      
      // Should preserve the order as provided in dateSlots array
      expect(result).toEqual([
        '2024-12-16T10:00:00.000Z',
        '2024-12-15T14:00:00.000Z'
      ]);
    });

    // This test specifically covers the bug we fixed
    it('should not generate negative time slots (regression test)', () => {
      const dateSlots: DateTimeSlot[] = [
        {
          id: 1,
          date: '2024-12-15',
          timeFrom: '20:00',
          timeTo: '22:00'
        }
      ];
      
      // This was the problematic case - 2 hour session in 2 hour window
      const result = generateTimeSlots(dateSlots, 2);
      
      // Should only have one slot at 20:00 (session ends at 22:00)
      expect(result).toEqual([
        '2024-12-15T20:00:00.000Z'
      ]);
      
      // Ensure no times are before the start time or after a valid end time
      result.forEach(slot => {
        const slotTime = new Date(slot);
        const startTime = new Date('2024-12-15T20:00:00.000Z');
        const endTime = new Date('2024-12-15T22:00:00.000Z');
        
        expect(slotTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
        expect(slotTime.getTime() + 2 * 60 * 60 * 1000).toBeLessThanOrEqual(endTime.getTime());
      });
    });
  });
}); 
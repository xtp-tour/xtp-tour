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

// Manual test function - run this to verify functionality
export const testTimeSlotCompression = () => {
  console.log('Testing Time Slot Compression...\n');

  // Test Case 1: Single time slot
  const singleSlot = [createTimeSlot('2024-01-15 14:00')];
  console.log('Single slot:', compressTimeSlots(singleSlot));
  // Expected: "Mon, Jan 15 • 2:00 PM"

  // Test Case 2: Two consecutive slots (should show range)
  const consecutiveSlots = [
    createTimeSlot('2024-01-15 14:00'),
    createTimeSlot('2024-01-15 14:30')
  ];
  console.log('Consecutive slots:', compressTimeSlots(consecutiveSlots));
  // Expected: "Mon, Jan 15 • 2:00 PM–3:00 PM"

  // Test Case 3: Three consecutive slots (user's example: 8:00, 8:30, 9:00)
  const threeConsecutive = [
    createTimeSlot('2024-01-15 08:00'),
    createTimeSlot('2024-01-15 08:30'),
    createTimeSlot('2024-01-15 09:00')
  ];
  console.log('Three consecutive (8:00-9:00):', compressTimeSlots(threeConsecutive));
  // Expected: "Mon, Jan 15 • 8:00 AM–9:30 AM"

  // Test Case 4: Non-consecutive times (should generalize)
  const nonConsecutive = [
    createTimeSlot('2024-01-15 08:30'),
    createTimeSlot('2024-01-15 10:30')
  ];
  console.log('Non-consecutive times:', compressTimeSlots(nonConsecutive));
  // Expected: Something like "Mon, Jan 15 • early morning & morning"

  // Test Case 5: Multiple times across day (should generalize to time of day)
  const wholeDaySlots = [
    createTimeSlot('2024-01-15 08:00'),
    createTimeSlot('2024-01-15 12:00'),
    createTimeSlot('2024-01-15 18:00')
  ];
  console.log('Whole day slots:', compressTimeSlots(wholeDaySlots));
  // Expected: "Mon, Jan 15 • whole day" or similar

  // Test Case 6: User's specific bug case - 6 slots across multiple days and time periods
  const userBugCase = [
    createTimeSlot('2024-08-14 06:00'), // Thu, morning
    createTimeSlot('2024-08-14 06:30'), // Thu, morning
    createTimeSlot('2024-08-17 12:30'), // Sun, afternoon
    createTimeSlot('2024-08-18 15:30'), // Mon, afternoon
    createTimeSlot('2024-08-18 16:00'), // Mon, afternoon
    createTimeSlot('2024-08-18 16:30')  // Mon, afternoon
  ];
  console.log('User bug case (6 slots, multi-day, multi-time):', compressTimeSlots(userBugCase));
  // Expected: "Aug 14–Aug 18 • afternoon & morning" (simplified time categories)

  // Test Case 7: Multi-day with 3+ time categories (should show "whole day")
  const wholeDayMultiDay = [
    createTimeSlot('2024-08-14 08:00'), // Thu, morning
    createTimeSlot('2024-08-15 14:00'), // Fri, afternoon
    createTimeSlot('2024-08-16 19:00'), // Sat, evening
    createTimeSlot('2024-08-17 02:00')  // Sun, night
  ];
  console.log('Multi-day whole day (4 time categories):', compressTimeSlots(wholeDayMultiDay));
  // Expected: "Aug 14–Aug 17 • whole day"

  // Test Case 8: Empty array
  console.log('Empty array:', compressTimeSlots([]));
  // Expected: ""

  console.log('\nTesting completed!');
};

// Auto-run test in development (comment out for production)
// testTimeSlotCompression();
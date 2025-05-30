export interface DateTimeSlot {
  id: number;
  date: string;
  timeFrom: string;
  timeTo: string;
}

const formatDateTime = (date: string, time: string): string => {
  return `${date}T${time}:00.000Z`;
};

/**
 * Generates time slots based on date/time slots and session duration
 * @param dateSlots Array of date/time slots
 * @param sessionDuration Session duration in hours
 * @returns Array of ISO timestamp strings representing possible session start times
 */
export const generateTimeSlots = (dateSlots: DateTimeSlot[], sessionDuration: number): string[] => {
  const timeSlots: string[] = [];
  
  for (const slot of dateSlots) {
    const sessionDurationMinutes = sessionDuration * 60; // Convert hours to minutes
    
    const startTime = new Date(formatDateTime(slot.date, slot.timeFrom));
    const endTime = new Date(formatDateTime(slot.date, slot.timeTo));
    
    // Generate time slots every 30 minutes from start time
    // Each slot represents a potential session start time
    // Stop generating slots when there isn't enough time left for a full session
    const cur = new Date(startTime);
    const lastPossibleStart = new Date(endTime.getTime() - sessionDurationMinutes * 60 * 1000);
    
    while (cur <= lastPossibleStart) {
      timeSlots.push(cur.toISOString());
      cur.setMinutes(cur.getMinutes() + 30); // 30-minute intervals
    }
  }
  
  return timeSlots;
}; 
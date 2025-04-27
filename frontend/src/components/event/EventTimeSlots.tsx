import React from 'react';
import TimeSlotLabels from '../TimeSlotLabels';
import { TimeSlot, SECTION_TITLES } from './types';

interface EventTimeSlotsProps {
  timeSlots: TimeSlot[];
  hasSelectedTimeSlots?: boolean;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
}

const EventTimeSlots: React.FC<EventTimeSlotsProps> = ({
  timeSlots,
  hasSelectedTimeSlots,
  onTimeSlotClick,
}) => {
  // Check if any time slots have user selection
  const hasUserSelectedTimeSlots = timeSlots.some(slot => slot.isUserSelected);
  
  // If there are user-selected time slots, we should show that as a special title
  const title = hasUserSelectedTimeSlots 
    ? "Your Selected Times"
    : hasSelectedTimeSlots 
      ? SECTION_TITLES.timeSlots.selected 
      : SECTION_TITLES.timeSlots.available;

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        {title}
      </h6>
      <TimeSlotLabels
        timeSlots={timeSlots}
        onSelect={onTimeSlotClick}
      />
    </div>
  );
};

export default EventTimeSlots; 
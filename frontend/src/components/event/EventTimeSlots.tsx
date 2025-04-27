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
}) => (
  <div className="mb-4">
    <h6 className="text-muted mb-3">
      {hasSelectedTimeSlots ? SECTION_TITLES.timeSlots.selected : SECTION_TITLES.timeSlots.available}
    </h6>
    <TimeSlotLabels
      timeSlots={timeSlots}
      onSelect={onTimeSlotClick}
    />
  </div>
);

export default EventTimeSlots; 
import React from 'react';
import TimeSlotLabels from '../TimeSlotLabels';
import { TimeSlot, SECTION_TITLES } from './types';

// Define the TimeSlot type from TimeSlotLabels component
interface TimeSlotComponentType {
  date: Date | string;
  time: number;
  isSelected?: boolean;
  isAvailable?: boolean;
}

interface InvitationTimeSlotsProps {
  timeSlots: TimeSlot[];
  hasSelectedTimeSlots?: boolean;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
}

const InvitationTimeSlots: React.FC<InvitationTimeSlotsProps> = ({
  timeSlots,
  hasSelectedTimeSlots,
  onTimeSlotClick,
}) => {
  // Convert TimeSlot to TimeSlotComponentType
  const convertedTimeSlots: TimeSlotComponentType[] = timeSlots.map(slot => ({
    ...slot,
    date: slot.date // This works because TimeSlotComponentType.date accepts Date
  }));

  // Handle the callback conversion
  const handleTimeSlotSelect = onTimeSlotClick 
    ? (componentSlot: TimeSlotComponentType) => {
        // Convert back to our internal TimeSlot type
        const originalSlot = timeSlots.find(
          s => s.time === componentSlot.time && 
               s.date.getTime() === (typeof componentSlot.date === 'string' 
                 ? new Date(componentSlot.date).getTime() 
                 : componentSlot.date.getTime())
        );
        if (originalSlot && onTimeSlotClick) {
          onTimeSlotClick(originalSlot);
        }
      }
    : undefined;

  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        {hasSelectedTimeSlots ? SECTION_TITLES.timeSlots.selected : SECTION_TITLES.timeSlots.available}
      </h6>
      <TimeSlotLabels
        timeSlots={convertedTimeSlots}
        onSelect={handleTimeSlotSelect}
      />
    </div>
  );
};

export default InvitationTimeSlots; 
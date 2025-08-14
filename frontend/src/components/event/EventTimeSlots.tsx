import React from 'react';
import TimeSlotLabels from './TimeSlotLabels';
import { TimeSlot, getSectionTitleKey } from './types';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  // Check if any time slots have user selection
  const hasUserSelectedTimeSlots = timeSlots.some(slot => slot.isUserSelected);
  
  // If there are user-selected time slots, we should show that as a special title
  const title = hasUserSelectedTimeSlots 
    ? t(getSectionTitleKey('startTimes')) // Your Selected Times
    : hasSelectedTimeSlots 
      ? t(getSectionTitleKey('startTimes')) 
      : t(getSectionTitleKey('availableStartTimes'));

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
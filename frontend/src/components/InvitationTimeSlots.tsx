import React from 'react';
import TimeSlotLabels from './TimeSlotLabels';

interface TimeSlot {
  date: Date;
  time: number;
  isAvailable?: boolean;
  isSelected?: boolean;
}

interface InvitationTimeSlotsProps {
  timeSlots: TimeSlot[];
  hasSelectedTimeSlots?: boolean;
}

const InvitationTimeSlots: React.FC<InvitationTimeSlotsProps> = ({
  timeSlots,
  hasSelectedTimeSlots,
}) => {
  return (
    <div className="mb-4">
      <h6 className="text-muted mb-3">
        {hasSelectedTimeSlots ? 'Start Times' : 'Available Start Times'}
      </h6>
      <TimeSlotLabels timeSlots={timeSlots} />
    </div>
  );
};

export default InvitationTimeSlots; 
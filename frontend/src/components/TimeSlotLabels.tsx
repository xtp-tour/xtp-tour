import React from 'react';
import { formatTime } from '../utils/dateUtils';

interface TimeSlot {
  date: Date | string;
  time: number;
  isSelected?: boolean;
  isAvailable?: boolean;
}

interface Props {
  timeSlots: TimeSlot[];
  onSelect?: (slot: TimeSlot) => void;
  className?: string;
}

const TimeSlotLabels: React.FC<Props> = ({ timeSlots, onSelect, className = '' }) => {
  // Group slots by date
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const dateStr = slot.date instanceof Date 
      ? slot.date.toISOString().split('T')[0]
      : slot.date;
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className={`d-flex flex-column gap-4 ${className}`}>
      {Object.entries(groupedSlots).map(([dateStr, slots]) => (
        <div key={dateStr} className="time-slot-group">
          <h6 className="d-flex align-items-center text-primary mb-3">
            <i className="bi bi-calendar-event me-2"></i>
            {new Date(dateStr).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </h6>
          <div className="d-flex flex-wrap gap-2 ps-4">
            {slots.map((slot, index) => {
              const labelClass = slot.isSelected
                ? 'bg-success text-white'
                : slot.isAvailable === false
                  ? 'bg-light text-muted'
                  : 'bg-light text-dark border border-primary border-opacity-25';

              return (
                <div
                  key={`${dateStr}-${index}`}
                  className={`badge ${labelClass} p-2 ${onSelect ? 'cursor-pointer' : ''}`}
                  onClick={() => onSelect && slot.isAvailable !== false && onSelect(slot)}
                  role={onSelect ? 'button' : undefined}
                  style={{ cursor: onSelect && slot.isAvailable !== false ? 'pointer' : 'default' }}
                >
                  <i className={`bi bi-clock me-1 ${slot.isSelected ? 'text-white' : 'text-primary'}`}></i>
                  {formatTime(slot.time)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimeSlotLabels; 
import React from 'react';
import { TimeSlot } from './invitation/types';


interface Props {
  timeSlots: TimeSlot[];
  onSelect?: (slot: TimeSlot) => void;
  className?: string;
}

const TimeSlotLabels: React.FC<Props> = ({ timeSlots, onSelect, className = '' }) => {
  // Group slots by date
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const dateStr = slot.date.toISOString().split('T')[0];
    
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
          <h6 className="d-flex align-items-center mb-3">
            <i className="bi bi-calendar-event me-2" style={{ color: 'var(--tennis-accent)' }}></i>
            <span style={{ color: 'var(--tennis-navy)' }}>
              {new Date(dateStr).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </h6>
          <div className="d-flex flex-wrap gap-2 ps-4">
            {slots.map((slot, index) => {
              const style = slot.isSelected
                ? {
                    backgroundColor: 'var(--tennis-navy)',
                    color: 'var(--tennis-white)',
                    borderColor: 'var(--tennis-navy)'
                  }
                : slot.isAvailable === false
                ? {
                    backgroundColor: 'var(--tennis-light)',
                    color: 'var(--tennis-gray)',
                    borderColor: 'transparent'
                  }
                : {
                    backgroundColor: 'var(--tennis-light)',
                    color: 'var(--tennis-navy)',
                    border: '1px solid var(--tennis-navy)',
                    borderOpacity: '0.25'
                  };

              return (
                <div
                  key={`${dateStr}-${index}`}
                  className={`badge p-2 ${onSelect ? 'cursor-pointer' : ''}`}
                  onClick={() => onSelect && slot.isAvailable !== false && onSelect(slot)}
                  role={onSelect ? 'button' : undefined}
                  style={{
                    ...style,
                    cursor: onSelect && slot.isAvailable !== false ? 'pointer' : 'default'
                  }}
                >
                  <i className={`bi bi-clock me-1`} style={{ 
                    color: slot.isSelected 
                      ? 'var(--tennis-white)' 
                      : slot.isAvailable === false
                        ? 'var(--tennis-gray)'
                        : 'var(--tennis-navy)'
                  }}></i>
                  { slot.date.format('HH:mm') }
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
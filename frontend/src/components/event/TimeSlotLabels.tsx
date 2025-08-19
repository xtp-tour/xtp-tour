import React from 'react';
import { TimeSlot } from './types';
import { BADGE_STYLES } from '../../styles/badgeStyles';
import { formatDateOnlyLocalized, formatTimeOnlyLocalized } from '../../utils/i18nDateUtils';


interface Props {
  timeSlots: TimeSlot[];
  onSelect?: (slot: TimeSlot) => void;
  className?: string;
}

const TimeSlotLabels: React.FC<Props> = ({ timeSlots, onSelect, className = '' }) => {
  // Group slots by date using moment
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const dateKey = slot.date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className={`d-flex flex-column gap-4 ${className}`}>
      {Object.entries(groupedSlots).map(([dateKey, slots]) => (
        <div key={dateKey} className="time-slot-group">
          <h6 className="d-flex align-items-center mb-3">
            <i className="bi bi-calendar-event me-2" style={{ color: 'var(--tennis-sage)' }}></i>
            <span style={{ color: 'var(--tennis-navy, #212529)' }}>
              {formatDateOnlyLocalized(dateKey)}
            </span>
          </h6>
          <div className="d-flex flex-wrap gap-2 ps-4">
            {slots.map((slot, index) => {
              // Style based on slot status with fallback colors
              let style;
              let iconColor;
              
              if (slot.isUserSelected) {
                // User selected time slot (use navy color like in JoinEventModal)
                style = {
                  backgroundColor: 'var(--tennis-navy, #212529)',
                  color: 'white',
                  transform: 'scale(1.05)'
                };
                iconColor = 'white';
              } else if (slot.isSelected) {
                // Confirmed time slot (navy color)
                style = {
                  backgroundColor: 'var(--tennis-navy, #212529)',
                  color: 'white',
                  border: '1px solid var(--tennis-navy, #212529)'
                };
                iconColor = 'white';
              } else if (slot.isAvailable === false) {
                // Unavailable time slot (gray)
                style = {
                  backgroundColor: 'var(--tennis-light, #f8f9fa)',
                  color: 'var(--tennis-gray, #6c757d)',
                  border: '1px solid transparent'
                };
                iconColor = 'var(--tennis-gray, #6c757d)';
              } else {
                // Available time slot (outline)
                style = {
                  backgroundColor: 'var(--tennis-light, #f8f9fa)',
                  color: 'var(--tennis-navy, #212529)',
                  border: '1px solid var(--tennis-navy, #212529)',
                  borderOpacity: '0.25'
                };
                iconColor = 'var(--tennis-navy, #212529)';
              }


              return (
                <div
                  key={`${dateKey}-${index}`}
                  className={`badge ${onSelect ? 'cursor-pointer' : ''}`}
                  onClick={() => onSelect && slot.isAvailable !== false && onSelect(slot)}
                  role={onSelect ? 'button' : undefined}
                  style={{
                    ...BADGE_STYLES,
                    ...style,
                    cursor: onSelect && slot.isAvailable !== false ? 'pointer' : 'default'
                  }}
                >
                  <i className={`bi bi-clock me-1`} style={{ color: iconColor }}></i>
                  {formatTimeOnlyLocalized(slot.date)}
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
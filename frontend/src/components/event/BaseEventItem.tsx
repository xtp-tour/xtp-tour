import React, { useState } from 'react';
import { components } from '../../types/schema';
import EventHeader from './EventHeader';
import DefaultEventBody from './DefaultEventBody';
import ConfirmedEventBody from './ConfirmedEventBody';
import { ActionButton, StyleProps, TimeSlot } from './types';
import moment from 'moment';

type ApiEvent = components['schemas']['ApiEvent'];

interface BaseEventItemProps extends StyleProps {
  event: ApiEvent;
  headerTitle: string;
  headerSubtitle?: string | React.ReactNode;
  timeSlots: TimeSlot[];
  timestamp: moment.Moment;
  actionButton: ActionButton;
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
  defaultCollapsed?: boolean;
  isMyEvent?: boolean;
  children?: React.ReactNode;
  shareButton?: React.ReactNode;
}

const formatTimeSlotSummary = (timeSlots: TimeSlot[]): string => {
  if (timeSlots.length === 0) return '';
  
  const firstSlot = timeSlots[0];
  
  if (timeSlots.length === 1) {
    return firstSlot.date.format('ddd, MMM D • h:mm A');
  }
  
  if (timeSlots.length === 2) {
    const firstDate = firstSlot.date;
    const secondDate = timeSlots[1].date;
    
    // Check if both slots are on the same day
    if (firstDate.isSame(secondDate, 'day')) {
      return `${firstDate.format('ddd, MMM D')} • ${firstDate.format('h:mm A')}–${secondDate.format('h:mm A')}`;
    } else {
      return `${firstDate.format('ddd, MMM D • h:mm A')} and ${secondDate.format('ddd, MMM D • h:mm A')}`;
    }
  }
  
  return `${firstSlot.date.format('ddd, MMM D • h:mm A')}, ${timeSlots[1].date.format('ddd, MMM D • h:mm A')}...`;
};

const BaseEventItem: React.FC<BaseEventItemProps> = ({
  event,
  headerTitle,
  headerSubtitle,
  colorClass = 'text-primary',
  timeSlots,
  timestamp,
  actionButton,
  userSelectedLocations,
  onLocationClick,
  onTimeSlotClick,
  defaultCollapsed = false,
  isMyEvent = false,
  children,
  shareButton,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isConfirmed = event.status === 'CONFIRMED';
  
  // Update color classes for confirmed events - use navy instead of green
  if (isConfirmed) {
    colorClass = 'text-primary';
  }

  return (
    <div className="card mb-3 overflow-hidden">
      <div className="card-header bg-transparent border-0 p-0">
        <EventHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          colorClass={colorClass}
          actionButton={actionButton}
          timeSlotSummary={formatTimeSlotSummary(timeSlots)}
          joinedCount={event.joinRequests ? event.joinRequests.length : 0}
          event={event}
          shareButton={shareButton}
        />
      </div>

      {!isCollapsed && (
        isConfirmed ? (
          <ConfirmedEventBody
            event={event}
            colorClass={colorClass}
            timeSlots={timeSlots}
            timestamp={timestamp}
          >
            {children}
          </ConfirmedEventBody>
        ) : (
          <DefaultEventBody
            event={event}
            timeSlots={timeSlots}
            timestamp={timestamp}
            userSelectedLocations={userSelectedLocations}
            onLocationClick={onLocationClick}
            onTimeSlotClick={onTimeSlotClick}
            isMyEvent={isMyEvent}
          >
            {children}
          </DefaultEventBody>
        )
      )}
      
      {/* Bottom chevron button - full width */}
      <div className="card-footer bg-transparent border-0 p-0">
        <button
          type="button"
          className="w-100 d-flex justify-content-center align-items-center border-0 bg-transparent text-muted"
          style={{ 
            borderTop: '1px solid #dee2e6',
            padding: '8px 16px',
            cursor: 'pointer',
            minHeight: '44px'
          }}
          aria-label={isCollapsed ? 'Show event details' : 'Hide event details'}
          aria-expanded={!isCollapsed}
          onClick={(e) => {
            setIsCollapsed(!isCollapsed);
            e.currentTarget.blur();
          }}
        >
          <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'} me-2`} aria-hidden="true"></i>
          <span>{isCollapsed ? 'Show Details' : 'Hide Details'}</span>
        </button>
      </div>
    </div>
  );
};

export default BaseEventItem; 
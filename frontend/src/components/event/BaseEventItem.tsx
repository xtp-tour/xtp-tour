import React, { useState } from 'react';
import { components } from '../../types/schema';
import EventHeader from './EventHeader';
import DefaultEventBody from './DefaultEventBody';
import ConfirmedEventBody from './ConfirmedEventBody';
import { ActionButton, StyleProps, TimeSlot } from './types';
import { formatTimeSlotSummary } from '../../utils/dateUtils';
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
          joinedCount={event.joinRequests?.filter(req => req.isRejected === false).length || 0}
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
            padding: '4px 16px',
            cursor: 'pointer',
            minHeight: '44px',
            fontSize: '0.875rem'
          }}
          aria-label={isCollapsed ? 'Show event details' : 'Hide event details'}
          aria-expanded={!isCollapsed}
          onClick={(e) => {
            setIsCollapsed(!isCollapsed);
            e.currentTarget.blur();
          }}
        >
          <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'} me-1`} aria-hidden="true" style={{ fontSize: '0.75rem' }}></i>
          <span>{isCollapsed ? 'Show Details' : 'Hide Details'}</span>
        </button>
      </div>
    </div>
  );
};

export default BaseEventItem; 
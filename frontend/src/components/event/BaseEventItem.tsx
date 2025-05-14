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
}

const formatTimeSlotSummary = (timeSlots: TimeSlot[]): string => {
  if (timeSlots.length === 0) return '';
  if (timeSlots.length === 1) {
    return timeSlots[0].date.format('MMM D, h:mm A');
  }
  if (timeSlots.length === 2) {
    return `${timeSlots[0].date.format('MMM D, h:mm A')} and ${timeSlots[1].date.format('MMM D, h:mm A')}`;
  }
  return `${timeSlots[0].date.format('MMM D, h:mm A')}, ${timeSlots[1].date.format('MMM D, h:mm A')}...`;
};

const BaseEventItem: React.FC<BaseEventItemProps> = ({
  event,
  headerTitle,
  headerSubtitle,
  colorClass = 'text-primary',
  borderColorClass = 'border-primary',
  timeSlots,
  timestamp,
  actionButton,
  userSelectedLocations,
  onLocationClick,
  onTimeSlotClick,
  defaultCollapsed = false,
  isMyEvent = false,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isConfirmed = event.status === 'CONFIRMED';
  
  // Update color classes for confirmed events
  if (isConfirmed) {
    colorClass = 'text-success';
    borderColorClass = 'border-success';
  }

  return (
    <div className="card mb-3 overflow-hidden">
      <div className="card-header bg-transparent border-0 p-0">
        <EventHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          colorClass={colorClass}
          timestamp={timestamp}
          actionButton={actionButton}
          isCollapsed={isCollapsed}
          timeSlotSummary={formatTimeSlotSummary(timeSlots)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          joinedCount={event.joinRequests ? event.joinRequests.length : 0}
          event={event}
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
            colorClass={colorClass}
            borderColorClass={borderColorClass}
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
    </div>
  );
};

export default BaseEventItem; 
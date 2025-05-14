import React, { useState } from 'react';
import { components } from '../../types/schema';
import EventHeader from './EventHeader';
import EventLocations from './EventLocations';
import EventTimeSlots from './EventTimeSlots';
import EventDescription from './EventDescription';
import JoinedUsers from './JoinedUsers';
import { ActionButton, StyleProps, TimeSlot } from './types';
import moment from 'moment';
import TimeAgo from 'react-timeago';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

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

const formatFullTimestamp = (timestamp: moment.Moment): string => {
  return timestamp.format('MMMM D, YYYY [at] h:mm A');
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
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const momentTimestamp = moment.isMoment(timestamp) ? timestamp : moment(timestamp);

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
        <div className="card-body pt-2">
          {/* Created At Timestamp */}
          <div className="mb-3">
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id={`timestamp-tooltip-${momentTimestamp.valueOf()}`}>
                  {formatFullTimestamp(momentTimestamp)}
                </Tooltip>
              }
            >
              <div className="d-flex align-items-center small text-muted">
                <i className="bi bi-clock-history me-2"></i>
                <span>Created <TimeAgo date={momentTimestamp.toDate()} /></span>
              </div>
            </OverlayTrigger>
          </div>

          <EventLocations
            locations={event.locations}
            selectedLocations={event.confirmation?.location ? [event.confirmation.location] : undefined}
            userSelectedLocations={userSelectedLocations}
            colorClass={colorClass}
            borderColorClass={borderColorClass}
            onLocationClick={onLocationClick}
          />

          <EventTimeSlots
            timeSlots={timeSlots}
            hasSelectedTimeSlots={!!event.confirmation}
            onTimeSlotClick={onTimeSlotClick}
          />

          <EventDescription
            description={event.description}
          />

          <JoinedUsers joinRequests={event.joinRequests || []} />

          {children}
        </div>
      )}
    </div>
  );
};

export default BaseEventItem; 
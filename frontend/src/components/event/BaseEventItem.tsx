import React from 'react';
import { components } from '../../types/schema';
import EventHeader from './EventHeader';
import EventBadges from './EventBadges';
import EventLocations from './EventLocations';
import EventTimeSlots from './EventTimeSlots';
import EventDescription from './EventDescription';
import JoinedUsers from './JoinedUsers';
import { ActionButton, StyleProps, TimeSlot } from './types';
import moment from 'moment';

type ApiEvent = components['schemas']['ApiEvent'];

interface BaseEventItemProps extends StyleProps {
  event: ApiEvent;
  headerTitle: string;
  headerSubtitle?: string;
  timeSlots: TimeSlot[];
  timestamp: moment.Moment;
  actionButton: ActionButton;
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
}

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
}) => (
  <div className="card mb-3">
    <EventHeader
      title={headerTitle}
      subtitle={headerSubtitle}
      colorClass={colorClass}
      timestamp={timestamp}
      actionButton={actionButton}
    />

    <div className="card-body">
      <EventBadges
        eventType={event.eventType}
        expectedPlayers={event.expectedPlayers}
        skillLevel={event.skillLevel}
        sessionDuration={event.sessionDuration}
      />

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
    </div>
  </div>
);

export default BaseEventItem; 
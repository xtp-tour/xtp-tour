import React from 'react';
import { components } from '../../types/schema';
import InvitationHeader from './InvitationHeader';
import InvitationBadges from './InvitationBadges';
import InvitationLocations from './InvitationLocations';
import InvitationTimeSlots from './InvitationTimeSlots';
import InvitationDescription from './InvitationDescription';
import AcceptedUsers from './AcceptedUsers';
import { ActionButton, StyleProps, TimeSlot } from './types';

type ApiEvent = components['schemas']['ApiEvent'];

interface BaseInvitationItemProps extends StyleProps {
  invitation: ApiEvent;
  headerTitle: string;
  headerSubtitle?: string;
  timeSlots: TimeSlot[];
  timestamp: Date;
  actionButton: ActionButton;
  onLocationClick?: (location: string) => void;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
}

const BaseInvitationItem: React.FC<BaseInvitationItemProps> = ({
  invitation,
  headerTitle,
  headerSubtitle,
  colorClass = 'text-primary',
  borderColorClass = 'border-primary',
  timeSlots,
  timestamp,
  actionButton,
  onLocationClick,
  onTimeSlotClick,
}) => (
  <div className="card mb-3">
    <InvitationHeader
      title={headerTitle}
      subtitle={headerSubtitle}
      colorClass={colorClass}
      timestamp={timestamp}
      actionButton={actionButton}
    />

    <div className="card-body">
      <InvitationBadges
        invitationType={invitation.eventType}
        expectedPlayers={invitation.expectedPlayers}
        skillLevel={invitation.skillLevel}
        sessionDuration={invitation.sessionDuration}
      />

      <InvitationLocations
        locations={invitation.locations}
        selectedLocations={invitation.confirmation?.location ? [invitation.confirmation.location] : undefined}
        colorClass={colorClass}
        borderColorClass={borderColorClass}
        onLocationClick={onLocationClick}
      />

      <InvitationTimeSlots
        timeSlots={timeSlots}
        hasSelectedTimeSlots={!!invitation.confirmation}
        onTimeSlotClick={onTimeSlotClick}
      />

      <InvitationDescription
        description={invitation.description}
      />

      <AcceptedUsers joinRequests={invitation.joinRequests || []} />
    </div>
  </div>
);

export default BaseInvitationItem; 
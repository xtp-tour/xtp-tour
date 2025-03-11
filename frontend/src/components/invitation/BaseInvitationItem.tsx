import React from 'react';
import { Invitation } from '../../types/invitation';
import InvitationHeader from './InvitationHeader';
import InvitationBadges from './InvitationBadges';
import InvitationLocations from './InvitationLocations';
import InvitationTimeSlots from './InvitationTimeSlots';
import InvitationDescription from './InvitationDescription';
import { ActionButton, StyleProps, TimeSlot } from './types';

interface BaseInvitationItemProps extends StyleProps {
  invitation: Invitation;
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
        invitationType={invitation.invitationType}
        requestType={invitation.requestType}
        skillLevel={invitation.skillLevel}
        matchDuration={invitation.matchDuration}
      />

      <InvitationLocations
        locations={invitation.locations}
        selectedLocations={invitation.selectedLocations}
        colorClass={colorClass}
        borderColorClass={borderColorClass}
        onLocationClick={onLocationClick}
      />

      <InvitationTimeSlots
        timeSlots={timeSlots}
        hasSelectedTimeSlots={!!invitation.selectedTimeSlots}
        onTimeSlotClick={onTimeSlotClick}
      />

      <InvitationDescription
        description={invitation.description}
      />
    </div>
  </div>
);

export default BaseInvitationItem; 
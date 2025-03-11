import React from 'react';
import { Invitation } from '../types/invitation';
import InvitationHeader from './InvitationHeader';
import InvitationBadges from './InvitationBadges';
import InvitationLocations from './InvitationLocations';
import InvitationTimeSlots from './InvitationTimeSlots';
import InvitationDescription from './InvitationDescription';

interface BaseInvitationItemProps {
  invitation: Invitation;
  headerTitle: string;
  headerSubtitle?: string;
  avatarColorClass?: string;
  locationBorderColorClass?: string;
  timeSlots: Array<{ date: Date; time: number; isAvailable?: boolean; isSelected?: boolean }>;
  timestamp: Date;
  actionButton: {
    variant: string;
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

const BaseInvitationItem: React.FC<BaseInvitationItemProps> = ({
  invitation,
  headerTitle,
  headerSubtitle,
  avatarColorClass = 'text-primary',
  locationBorderColorClass = 'border-primary',
  timeSlots,
  timestamp,
  actionButton,
}) => {
  return (
    <div className="card mb-3">
      <InvitationHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        avatarColorClass={avatarColorClass}
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
          colorClass={avatarColorClass}
          borderColorClass={locationBorderColorClass}
        />

        <InvitationTimeSlots
          timeSlots={timeSlots}
          hasSelectedTimeSlots={!!invitation.selectedTimeSlots}
        />

        <InvitationDescription
          description={invitation.description}
        />
      </div>
    </div>
  );
};

export default BaseInvitationItem; 
import React, { useState } from 'react';
import { Invitation } from '../types/invitation';
import { AcceptInvitationModal } from './AcceptInvitationModal';
import BaseInvitationItem from './BaseInvitationItem';

interface Props {
  invitation: Invitation;
  onAccept: (invitation: Invitation) => void;
}

const AvailableInvitationItem: React.FC<Props> = ({ invitation }) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Convert dates to time slots format
  const timeSlots = invitation.dates.flatMap(date => {
    // Generate all possible 30-minute slots
    const slots = [];
    let currentTime = date.timespan.from;
    while (currentTime <= date.timespan.to - invitation.matchDuration * 100) {
      slots.push({
        date: date.date,
        time: currentTime,
        isAvailable: true
      });
      currentTime += 30;
      if (currentTime % 100 === 60) {
        currentTime += 40;
      }
    }
    return slots;
  });

  return (
    <>
      <BaseInvitationItem
        invitation={invitation}
        headerTitle={invitation.playerId}
        headerSubtitle="Looking for players"
        avatarColorClass="text-primary"
        locationBorderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={invitation.createdAt}
        actionButton={{
          variant: 'primary',
          icon: 'bi-check2-circle',
          label: 'Join',
          onClick: () => setShowAcceptModal(true)
        }}
      />

      <AcceptInvitationModal
        invitationId={invitation.id}
        hostName={invitation.playerId}
        show={showAcceptModal}
        onHide={() => setShowAcceptModal(false)}
        onAccepted={() => {
          // Refresh the invitations list
          window.location.reload();
        }}
      />
    </>
  );
};

export default AvailableInvitationItem; 
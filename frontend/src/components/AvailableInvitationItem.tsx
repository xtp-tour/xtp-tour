import React, { useState } from 'react';
import { Invitation } from '../types/invitation';
import { AcceptInvitationModal } from './AcceptInvitationModal';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot } from './invitation/types';

interface Props {
  invitation: Invitation;
  onAccept: (invitation: Invitation) => void;
}

const AvailableInvitationItem: React.FC<Props> = ({ invitation, onAccept }) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Convert invitation time slots to the format expected by BaseInvitationItem
  const timeSlots: TimeSlot[] = invitation.timeSlots.map(slot => ({
    date: slot.date,
    time: slot.time,
    isAvailable: true,
    isSelected: invitation.reservation?.date.getTime() === slot.date.getTime() && 
                invitation.reservation?.time === slot.time
  }));

  return (
    <>
      <BaseInvitationItem
        invitation={invitation}
        headerTitle={invitation.ownerId}
        headerSubtitle="Looking for players"
        colorClass="text-primary"
        borderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={invitation.createdAt}
        actionButton={{
          variant: 'outline-primary',
          icon: 'bi-check-circle',
          label: 'Accept',
          onClick: () => setShowAcceptModal(true)
        }}
      />

      <AcceptInvitationModal
        invitationId={invitation.id}
        hostName={invitation.ownerId}
        show={showAcceptModal}
        onHide={() => setShowAcceptModal(false)}
        onAccepted={() => {
          onAccept(invitation);
          setShowAcceptModal(false);
        }}
      />
    </>
  );
};

export default AvailableInvitationItem; 
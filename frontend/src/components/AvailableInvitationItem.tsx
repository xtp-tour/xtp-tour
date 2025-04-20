import React, { useState } from 'react';

import { AcceptInvitationModal } from './AcceptInvitationModal';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './invitation/types';
import { ApiEvent } from '../types/api';



interface Props {
  invitation: ApiEvent;
  onAccept: (invitation: ApiEvent) => void;
}

const AvailableInvitationItem: React.FC<Props> = ({ invitation, onAccept }) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Convert invitation time slots to the format expected by BaseInvitationItem
  const timeSlots: TimeSlot[] = invitation.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, invitation.confirmation));

  return (
    <>
      <BaseInvitationItem
        invitation={invitation}
        headerTitle={invitation.userId || ''}
        headerSubtitle="Looking for players"
        colorClass="text-primary"
        borderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={new Date(invitation.createdAt || '')}
        actionButton={{
          variant: 'outline-primary',
          icon: 'bi-check-circle',
          label: 'Accept',
          onClick: () => setShowAcceptModal(true)
        }}
      />

      <AcceptInvitationModal
        invitationId={invitation.id || ''}
        hostName={invitation.userId || ''}
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
import React from 'react';
import { components } from '../types/schema';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './invitation/types';

type ApiEvent = components['schemas']['ApiEvent'];

interface Props {
  invitation: ApiEvent;
  onDelete: (id: string) => Promise<void>;
}

const MyInvitationItem: React.FC<Props> = ({ invitation, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      await onDelete(invitation.id || '');
    }
  };

  // Convert invitation time slots to the format expected by BaseInvitationItem
  const timeSlots: TimeSlot[] = invitation.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, invitation.confirmation, true));  

  return (
    <BaseInvitationItem
      invitation={invitation}
      headerTitle="Your Invitation"
      colorClass="text-primary"
      borderColorClass="border-primary"
      timeSlots={timeSlots}
      timestamp={new Date(invitation.createdAt || '')}
      actionButton={{
        variant: 'outline-danger',
        icon: 'bi-x-circle',
        label: 'Cancel',
        onClick: handleDelete
      }}
    />
  );
};

export default MyInvitationItem; 
import React from 'react';
import { Event } from '../types/event';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot } from './invitation/types';

interface Props {
  invitation: Event;
  onDelete: (id: string) => Promise<void>;
}

const MyInvitationItem: React.FC<Props> = ({ invitation, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      await onDelete(invitation.id);
    }
  };

  // Convert invitation time slots to the format expected by BaseInvitationItem
  const timeSlots: TimeSlot[] = invitation.timeSlots.map(slot => ({
    date: slot.date,
    time: slot.time,
    isAvailable: true,
    isSelected: invitation.reservation?.date.getTime() === slot.date.getTime() && 
                invitation.reservation?.time === slot.time
  }));

  return (
    <BaseInvitationItem
      invitation={invitation}
      headerTitle="Your Invitation"
      colorClass="text-primary"
      borderColorClass="border-primary"
      timeSlots={timeSlots}
      timestamp={invitation.createdAt}
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
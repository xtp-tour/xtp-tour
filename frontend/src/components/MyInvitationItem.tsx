import React from 'react';
import { Invitation } from '../types/invitation';
import BaseInvitationItem from './invitation/BaseInvitationItem';

interface Props {
  invitation: Invitation;
  onDelete: (id: string) => Promise<void>;
}

const MyInvitationItem: React.FC<Props> = ({ invitation, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      await onDelete(invitation.id);
    }
  };

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
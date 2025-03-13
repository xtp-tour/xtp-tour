import React from 'react';
import { Invitation } from '../services/domain/invitation';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { format } from 'date-fns';

interface Props {
  invitation: Invitation;
}

const ConfirmedInvitationItem: React.FC<Props> = ({ invitation }) => {
  const selectedTimeSlot = invitation.selectedTimeSlots?.[0];
  const selectedLocation = invitation.selectedLocations?.[0];

  if (!selectedTimeSlot || !selectedLocation) {
    return null;
  }

  // Format the time in HHMM format to a readable string
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return format(new Date(0, 0, 0, hours, minutes), 'h:mm a');
  };

  const timeSlots = [{
    date: new Date(selectedTimeSlot.date),
    time: selectedTimeSlot.startTime,
    isSelected: true
  }];

  const actionButton = {
    variant: 'success',
    icon: 'bi-check-circle-fill',
    label: 'Confirmed',
    onClick: () => {},
    disabled: true
  };

  // Update the description to include the confirmed session details
  const sessionDetails = `
    📅 ${format(new Date(selectedTimeSlot.date), 'EEEE, MMMM d, yyyy')}
    🕒 ${formatTime(selectedTimeSlot.startTime)}
    📍 ${selectedLocation}
  `.trim();

  const enhancedInvitation = {
    ...invitation,
    description: invitation.description
      ? `${invitation.description}\n\n${sessionDetails}`
      : sessionDetails
  };

  return (
    <BaseInvitationItem
      invitation={enhancedInvitation}
      headerTitle={invitation.isOwner ? 'Your Session' : invitation.ownerId}
      headerSubtitle={invitation.isOwner ? undefined : 'Host'}
      colorClass="text-success"
      borderColorClass="border-success"
      timeSlots={timeSlots}
      timestamp={invitation.updatedAt || invitation.createdAt}
      actionButton={actionButton}
    />
  );
};

export default ConfirmedInvitationItem; 
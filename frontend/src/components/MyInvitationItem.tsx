import React, { useState } from 'react';
import { Invitation, InvitationStatus } from '../services/domain/invitation';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { ConfirmInvitationModal } from './ConfirmInvitationModal';

interface Props {
  invitation: Invitation;
  onDelete: (id: string) => Promise<void>;
  onConfirm?: () => void;
}

const MyInvitationItem: React.FC<Props> = ({ invitation, onDelete, onConfirm }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const getActionButton = () => {
    if (invitation.status === InvitationStatus.Accepted) {
      return {
        variant: 'primary',
        icon: 'bi-check-circle',
        label: 'Confirm Session',
        onClick: () => setShowConfirmModal(true)
      };
    }

    return {
      variant: 'outline-danger',
      icon: 'bi-x-circle',
      label: 'Cancel',
      onClick: handleDelete
    };
  };

  return (
    <>
      <BaseInvitationItem
        invitation={invitation}
        headerTitle="Your Invitation"
        colorClass="text-primary"
        borderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={invitation.createdAt}
        actionButton={getActionButton()}
      />

      <ConfirmInvitationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        invitation={invitation}
        onConfirm={() => {
          if (onConfirm) {
            onConfirm();
          }
          setShowConfirmModal(false);
        }}
      />
    </>
  );
};

export default MyInvitationItem; 
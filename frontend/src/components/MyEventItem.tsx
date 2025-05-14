import React, { useState } from 'react';
import { components } from '../types/schema';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import ConfirmEventModal from './ConfirmEventModal';
import CancelEventModal from './event/CancelEventModal';

type ApiEvent = components['schemas']['ApiEvent'];

interface Props {
  event: ApiEvent;
  onDelete: (id: string) => Promise<void>;
  onEventUpdated?: () => void;
}

const MyEventItem: React.FC<Props> = ({ event, onDelete, onEventUpdated }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, event.confirmation, true));  

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(event.id || '');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleConfirmEvent = () => {
    setShowConfirmModal(true);
  };

  const handleEventConfirmed = () => {
    if (onEventUpdated) {
      onEventUpdated();
    }
  };

  // Determine if the event can be confirmed
  const canConfirmEvent = () => {
    return (event.status === 'OPEN' || event.status === 'ACCEPTED') && 
           !event.confirmation && 
           event.joinRequests && 
           event.joinRequests.length > 0;
  };

  // Get action button based on event status
  const getActionButton = () => {
    // No action button for confirmed events
    if (event.status === 'CONFIRMED') {
      return {
        variant: 'outline-secondary',
        icon: 'bi-check-circle-fill',
        label: 'Confirmed',
        onClick: () => {},
        disabled: true,
        hidden: true // This will be used to completely hide the button
      };
    }
    
    if (canConfirmEvent()) {
      return {
        variant: 'outline-success',
        icon: 'bi-check-circle',
        label: 'Confirm',
        onClick: handleConfirmEvent
      };
    }
    
    return {
      variant: 'outline-danger',
      icon: 'bi-x-circle',
      label: 'Cancel',
      onClick: handleDelete
    };
  };

  // Get color based on event status
  const getStatusColors = () => {
    if (event.status === 'CONFIRMED') {
      return {
        colorClass: 'text-success',
        borderColorClass: 'border-success'
      };
    }
    if (event.status === 'CANCELLED' || event.status === 'RESERVATION_FAILED') {
      return {
        colorClass: 'text-danger',
        borderColorClass: 'border-danger'
      };
    }
    return {
      colorClass: 'text-primary',
      borderColorClass: 'border-primary'
    };
  };

  const { colorClass, borderColorClass } = getStatusColors();

  return (
    <>
      <BaseEventItem
        event={event}
        headerTitle="Your Event"
        colorClass={colorClass}
        borderColorClass={borderColorClass}
        timeSlots={timeSlots}
        timestamp={moment(event.createdAt || '')}
        actionButton={getActionButton()}
        defaultCollapsed={true}
        isMyEvent={true}
      />

      {/* Cancel Event Modal */}
      <CancelEventModal
        event={event}
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isDeleting={deleting}
      />

      {/* Confirm Event Modal */}
      <ConfirmEventModal
        event={event}
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirmed={handleEventConfirmed}
      />
    </>
  );
};

export default MyEventItem; 
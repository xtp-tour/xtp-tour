import React, { useState } from 'react';
import { components } from '../types/schema';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import { getEventTypeLabel } from './event/EventBadges';
import ConfirmEventModal from './ConfirmEventModal';
import CancelEventModal from './event/CancelEventModal';
import Toast from './Toast';
import ShareButton from './ShareButton';
import ShareEventModal from './ShareEventModal';
import { useTranslation } from 'react-i18next';

type ApiEvent = components['schemas']['ApiEvent'];

interface Props {
  event: ApiEvent;
  onDelete: (id: string) => Promise<void>;
  onEventUpdated?: () => void;
}

const MyEventItem: React.FC<Props> = ({ event, onDelete, onEventUpdated }) => {
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  // Get action button
  const getActionButton = () => {
    // No action button for confirmed or expired events
    if (event.status === 'CONFIRMED' || event.status === 'EXPIRED') {
      return {
        variant: 'outline-secondary',
        icon: event.status === 'CONFIRMED' ? 'bi-check-circle-fill' : 'bi-clock-history',
        label: event.status === 'CONFIRMED' ? t('eventActions.confirmed') : t('eventStatus.expired'),
        onClick: () => {},
        disabled: true,
        hidden: true // This will be used to completely hide the button
      };
    }

    if (canConfirmEvent()) {
      return {
        variant: 'outline-success',
        icon: 'bi-check-circle',
        label: t('eventActions.confirm'),
        onClick: handleConfirmEvent
      };
    }

    return {
      variant: 'outline-danger',
      icon: 'bi-x-circle',
      label: t('eventActions.cancel'),
      onClick: handleDelete
    };
  };

  const getShareButton = () => {
    const handleShareEvent = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setShowShareModal(true);
    };
    return <ShareButton onClick={handleShareEvent} />;
  };

  // Get color based on event status
  const getStatusColors = () => {
    if (event.status === 'CONFIRMED') {
      return {
        colorClass: 'text-success',
        borderColorClass: 'border-success'
      };
    }
    if (event.status === 'CANCELLED' || event.status === 'RESERVATION_FAILED' || event.status === 'EXPIRED') {
      return {
        colorClass: 'text-secondary',
        borderColorClass: 'border-secondary'
      };
    }
    return {
      colorClass: 'text-primary',
      borderColorClass: 'border-primary'
    };
  };

  const { colorClass } = getStatusColors();

  return (
    <>
      <BaseEventItem
        event={event}
        headerTitle={getEventTypeLabel(event.eventType, t)}
        colorClass={colorClass}
        timeSlots={timeSlots}
        actionButton={getActionButton()}
        shareButton={getShareButton()}
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

      {/* Toast notification for sharing */}
      <Toast
        message={t('share.eventLinkCopied')}
        show={showToast}
        onHide={() => setShowToast(false)}
        type="success"
      />

      {/* Share Event Modal */}
      <ShareEventModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        eventId={event.id || ''}
        onShared={() => setShowToast(true)}
      />
    </>
  );
};

export default MyEventItem;
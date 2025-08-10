import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation, getEventTitle } from './event/types';
import { ApiEvent, ApiJoinRequest } from '../types/api';
import moment from 'moment';
import { useUser } from '@clerk/clerk-react';
import Toast from './Toast';
import ShareButton from './ShareButton';
import { useShareEvent } from '../hooks/useShareEvent';
import { BADGE_STYLES } from '../styles/badgeStyles';
import HostDisplay from './HostDisplay';

interface Props {
  event: ApiEvent;
  onCancelled?: () => void;
}

const JoinedEventItem: React.FC<Props> = ({ event, onCancelled }) => {
  const api = useAPI();
  const { user } = useUser();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userJoinRequest, setUserJoinRequest] = useState<ApiJoinRequest | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const { shareEvent } = useShareEvent({
    eventId: event.id || '',
    onSuccess: () => setShowToast(true)
  });

  // Find the user's join request
  useEffect(() => {
    if (event.joinRequests?.length && user?.id) {
      const foundRequest = event.joinRequests.find(req => 
        req.userId === user.id
      );
      setUserJoinRequest(foundRequest || null);
    }
  }, [event, user?.id]);

  const handleCancel = async () => {
    if (!userJoinRequest?.id) {
      setError('Join request ID not found');
      return;
    }

    try {
      setCancelling(true);
      setError(null);
      await api.cancelJoinRequest(event.id || '', userJoinRequest.id);
      setShowConfirmModal(false);
      onCancelled?.();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to cancel join request. Please try again later.');
      }
    } finally {
      setCancelling(false);
    }
  };

  // Get color classes based on event status
  const getColorClasses = () => {
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

  // Check if time slots are still available based on event status
  const isTimeSlotAvailable = event.status === 'OPEN' || event.status === 'ACCEPTED';

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => {
    // Check if this slot is in the user's selected time slots
    const isUserSelected = userJoinRequest?.timeSlots?.includes(slot);
    
    // Use the existing function with enhanced logic to consider user's selection
    return timeSlotFromDateAndConfirmation(
      slot, 
      event.confirmation,
      isTimeSlotAvailable,
      isUserSelected
    );
  });

  // Get user selected locations
  const userSelectedLocations = userJoinRequest?.locations || [];

  const { colorClass } = getColorClasses();

  // Get user's join request status with badge info
  const getJoinRequestStatus = () => {
    if (!userJoinRequest) return { text: '', variant: 'text-bg-secondary' };
    
    if (userJoinRequest.isRejected === true) {
      return { text: 'Request rejected', variant: 'text-bg-danger' };
    } else if (userJoinRequest.isRejected === false) {
      return { text: 'Request accepted', variant: 'text-bg-success' };
    } else {
      return { text: 'Waiting for host approval', variant: 'text-bg-warning' };
    }
  };

  const joinRequestStatus = getJoinRequestStatus();

  // Determine which status to show - prioritize event status for confirmed/completed events
  const getDisplayStatus = () => {
    if (event.status === 'CONFIRMED' || event.status === 'COMPLETED' || event.status === 'CANCELLED' || event.status === 'RESERVATION_FAILED') {
      // Show event status for final states
      return null; // Let EventHeader handle the status display
    } else {
      // Show join request status for ongoing events
      return joinRequestStatus;
    }
  };

  const displayStatus = getDisplayStatus();

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
        hidden: true
      };
    }

    return {
      variant: 'outline-danger',
      icon: 'bi-x-circle',
      label: 'Cancel',
      onClick: () => setShowConfirmModal(true),
      disabled: cancelling || event.status !== 'OPEN'
    };
  };

  const getShareButton = () => {
    return <ShareButton onClick={shareEvent} />;
  };

  return (
    <>
      <BaseEventItem
        event={event}
        headerTitle={getEventTitle(event.eventType, event.expectedPlayers)}
        headerSubtitle={
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <HostDisplay userId={event.userId || ''} fallback="Unknown Host" />
            {displayStatus && (
              <span className={`badge ${displayStatus.variant}`} style={BADGE_STYLES}>
                {displayStatus.text}
              </span>
            )}
          </div>
        }
        colorClass={colorClass}
        timeSlots={timeSlots}
        timestamp={moment(event.createdAt)}
        userSelectedLocations={userSelectedLocations}
        actionButton={getActionButton()}
        shareButton={getShareButton()}
        defaultCollapsed={true}
      />

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5">
            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
            Cancel Game Session
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p>Are you sure you want to cancel your participation in this game session?</p>
          <p className="text-muted mb-0">
            <i className="bi bi-info-circle me-2"></i>
            The host will be notified about your cancellation.
          </p>
          {error && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowConfirmModal(false)}
            disabled={cancelling}
          >
            Keep Participation
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cancelling...
              </>
            ) : (
              'Cancel Participation'
            )}
          </button>
        </Modal.Footer>
      </Modal>

      <Toast
        message="Event link copied to clipboard!"
        show={showToast}
        onHide={() => setShowToast(false)}
        type="success"
      />
    </>
  );
};

export default JoinedEventItem; 
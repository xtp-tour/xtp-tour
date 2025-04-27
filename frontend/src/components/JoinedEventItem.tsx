import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import { ApiEvent, ApiJoinRequest } from '../types/api';
import moment from 'moment';

interface Props {
  event: ApiEvent;
  onCancelled?: () => void;
}

const JoinedEventItem: React.FC<Props> = ({ event, onCancelled }) => {
  const api = useAPI();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userJoinRequest, setUserJoinRequest] = useState<ApiJoinRequest | null>(null);

  // In a real app, we would get the current user ID from authentication
  // For the mock implementation, 'current_user' is hardcoded in mockApi.ts
  const CURRENT_USER_ID = 'current_user';
  
  // Use this flag to force a test join request for debugging
  const USE_TEST_REQUEST = true;

  // Debug to check join requests in this event
  useEffect(() => {
    console.log('Event ID:', event.id);
    console.log('Event join requests:', event.joinRequests);
    
    if (USE_TEST_REQUEST) {
      // Create a test join request to check if styling works correctly
      const testRequest: ApiJoinRequest = {
        id: 'test-request',
        userId: CURRENT_USER_ID,
        locations: event.locations.slice(0, 1), // Take the first location
        timeSlots: event.timeSlots.slice(0, 1), // Take the first time slot
        status: 'WAITING',
        createdAt: new Date().toISOString(),
      };
      console.log('Using test request for styling:', testRequest);
      setUserJoinRequest(testRequest);
    } else if (event.joinRequests?.length) {
      const foundRequest = event.joinRequests.find(req => {
        console.log(`Comparing: ${req.userId} with ${CURRENT_USER_ID}`);
        return req.userId === CURRENT_USER_ID;
      });
      
      console.log('Found user join request:', foundRequest);
      setUserJoinRequest(foundRequest || null);
    }
  }, [event]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      setError(null);
      await api.deleteEvent(event.id || '');
      setShowConfirmModal(false);
      onCancelled?.();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to cancel event. Please try again later.');
      }
    } finally {
      setCancelling(false);
    }
  };

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => {
    // Check if this slot is in the user's selected time slots
    const isUserSelected = userJoinRequest?.timeSlots?.includes(slot);
    console.log(`Time slot ${slot} selected: ${isUserSelected}`);
    
    // Use the existing function with enhanced logic to consider user's selection
    return timeSlotFromDateAndConfirmation(
      slot, 
      event.confirmation,
      true,
      isUserSelected
    );
  });

  // Get user selected locations
  const userSelectedLocations = userJoinRequest?.locations || [];
  console.log('User selected locations:', userSelectedLocations);

  return (
    <>
      <BaseEventItem
        event={event}
        headerTitle={event.userId || ''}
        headerSubtitle="Host"
        colorClass="text-primary"
        borderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={moment(event.createdAt)}
        userSelectedLocations={userSelectedLocations}
        actionButton={{
          variant: 'outline-danger',
          icon: 'bi-x-circle',
          label: 'Cancel',
          onClick: () => setShowConfirmModal(true),
          disabled: cancelling
        }}
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
            className="btn btn-link text-decoration-none"
            onClick={() => setShowConfirmModal(false)}
            disabled={cancelling}
          >
            Keep Session
          </button>
          <button
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
              <>
                <i className="bi bi-x-circle me-2"></i>
                Yes, Cancel Session
              </>
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default JoinedEventItem; 
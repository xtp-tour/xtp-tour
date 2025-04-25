import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './invitation/types';
import { ApiEvent } from '../types/api';


interface Props {
  invitation: ApiEvent;
  onCancelled?: () => void;
}

const AcceptedInvitationItem: React.FC<Props> = ({ invitation, onCancelled }) => {
  const api = useAPI();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      setError(null);
      await api.deleteEvent(invitation.id || '');
      setShowConfirmModal(false);
      onCancelled?.();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to cancel invitation. Please try again later.');
      }
    } finally {
      setCancelling(false);
    }
  };

  // Convert invitation time slots to the format expected by BaseInvitationItem
  const timeSlots: TimeSlot[] = invitation.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, invitation.confirmation));

  return (
    <>
      <BaseInvitationItem
        invitation={invitation}
        headerTitle={invitation.userId || ''}
        headerSubtitle="Host"
        colorClass="text-primary"
        borderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={new Date(invitation.createdAt || '')}
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

export default AcceptedInvitationItem; 
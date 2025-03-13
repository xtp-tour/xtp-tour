import React, { useState } from 'react';
import { Invitation } from '../types/invitation';
import { Modal } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot } from './invitation/types';

interface Props {
  invitation: Invitation;
  onCancelled?: () => void;
}

const AcceptedInvitationItem: React.FC<Props> = ({ invitation, onCancelled }) => {
  const api = useAPI();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await api.deleteInvitation(invitation.id);
      setShowConfirmModal(false);
      onCancelled?.();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      // TODO: Implement error handling with toast notifications or error messages
    } finally {
      setCancelling(false);
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
    <>
      <BaseInvitationItem
        invitation={invitation}
        headerTitle={invitation.ownerId}
        headerSubtitle="Host"
        colorClass="text-primary"
        borderColorClass="border-primary"
        timeSlots={timeSlots}
        timestamp={invitation.createdAt}
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
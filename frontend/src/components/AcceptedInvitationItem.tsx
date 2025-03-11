import React, { useState } from 'react';
import { Invitation, InvitationType, RequestType } from '../types/invitation';
import { Button, Modal } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';
import TimeSlotLabels from './TimeSlotLabels';

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
      // In a real app, show an error message to the user
    } finally {
      setCancelling(false);
    }
  };

  const getInvitationTypeLabel = (type: InvitationType) => {
    switch (type) {
      case InvitationType.Match:
        return 'Match';
      case InvitationType.Training:
        return 'Training';
      default:
        return type;
    }
  };

  const getRequestTypeLabel = (type: RequestType) => {
    switch (type) {
      case RequestType.Single:
        return 'Single';
      case RequestType.Doubles:
        return 'Doubles';
      default:
        return type;
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
        isSelected: invitation.selectedTimeSlots?.some(
          slot => slot.date === date.date.toISOString().split('T')[0] && slot.startTime === currentTime
        )
      });
      currentTime += 30;
      if (currentTime % 100 === 60) {
        currentTime += 40;
      }
    }
    return slots;
  });

  return (
    <>
      <div className="card mb-3">
        <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <div className="rounded-circle bg-success bg-opacity-10 p-2">
                <i className="bi bi-person-circle text-success"></i>
              </div>
            </div>
            <div>
              <h6 className="mb-0">{invitation.playerId}</h6>
              <small className="text-success">Host</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <small className="text-muted">
              <i className="bi bi-clock-history me-1"></i>
              Accepted {invitation.updatedAt?.toLocaleDateString()}
            </small>
            <Button
              variant="outline-danger"
              onClick={() => setShowConfirmModal(true)}
              style={{ minWidth: '100px' }}
            >
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </Button>
          </div>
        </div>

        <div className="card-body">
          <div className="d-flex gap-2 mb-4">            
            <span className="badge bg-primary">{getInvitationTypeLabel(invitation.invitationType)}</span>
            <span className="badge bg-secondary">{getRequestTypeLabel(invitation.requestType)}</span>
            <span className="badge bg-info">{invitation.skillLevel}</span>
            <span className="badge bg-dark">
              <i className="bi bi-stopwatch me-1"></i>
              {invitation.matchDuration * 60} min
            </span>
          </div>

          <div className="mb-4">
            <h6 className="text-muted mb-3">Selected Locations</h6>
            <div className="d-flex flex-wrap gap-2">
              {(invitation.selectedLocations || invitation.locations).map((loc: string) => (
                <div key={loc} className="badge bg-light text-dark border border-success border-opacity-25 p-2">
                  <i className="bi bi-geo-alt me-1 text-success"></i>
                  {loc}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h6 className="text-muted mb-3">Start Times</h6>
            <TimeSlotLabels timeSlots={timeSlots} />
          </div>

          {invitation.description && (
            <div className="mb-4">
              <h6 className="text-muted mb-3">Description</h6>
              <div className="card bg-light border-0">
                <div className="card-body">
                  <p className="card-text mb-0 ps-4">
                    {invitation.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
          <Button
            variant="link"
            onClick={() => setShowConfirmModal(false)}
            className="text-decoration-none"
            disabled={cancelling}
          >
            Keep Session
          </Button>
          <Button
            variant="danger"
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
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AcceptedInvitationItem; 
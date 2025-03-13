import React from 'react';
import { Modal } from 'react-bootstrap';
import { Invitation } from '../services/domain/invitation';
import { useAPI } from '../services/api/provider';
import { format } from 'date-fns';

interface Props {
  show: boolean;
  onHide: () => void;
  invitation: Invitation;
  onConfirm: () => void;
}

export const ConfirmInvitationModal: React.FC<Props> = ({
  show,
  onHide,
  invitation,
  onConfirm
}) => {
  const api = useAPI();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.confirmInvitation(invitation.id);
      onConfirm();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm invitation');
    } finally {
      setLoading(false);
    }
  };

  const selectedTimeSlot = invitation.selectedTimeSlots?.[0];
  const selectedLocation = invitation.selectedLocations?.[0];

  if (!selectedTimeSlot || !selectedLocation) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Tennis Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <p className="mb-2">
            Please confirm that you have booked a court for this session with the following details:
          </p>
          <div className="card">
            <div className="card-body">
              <div className="mb-3">
                <i className="bi bi-calendar me-2"></i>
                <strong>Date:</strong>{' '}
                {format(new Date(selectedTimeSlot.date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="mb-3">
                <i className="bi bi-clock me-2"></i>
                <strong>Time:</strong>{' '}
                {format(new Date(0, 0, 0, Math.floor(selectedTimeSlot.startTime / 100), selectedTimeSlot.startTime % 100), 'h:mm a')}
              </div>
              <div>
                <i className="bi bi-geo-alt me-2"></i>
                <strong>Location:</strong>{' '}
                {selectedLocation}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-secondary"
          onClick={onHide}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Confirming...
            </>
          ) : (
            'Confirm Session'
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}; 
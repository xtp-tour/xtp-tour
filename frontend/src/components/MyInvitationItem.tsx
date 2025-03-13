import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Invitation, AckStatus } from '../services/domain/invitation';
import { ConfirmInvitationModal } from './ConfirmInvitationModal';
import { useAPI } from '../services/api/provider';
import { Location } from '../services/domain/locations';

interface Props {
  invitation: Invitation;
  onDelete: (id: string) => void;
}

const MyInvitationItem: React.FC<Props> = ({ invitation, onDelete }) => {
  const api = useAPI();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locations, setLocations] = useState<Map<string, Location>>(new Map());
  const [loadingLocations, setLoadingLocations] = useState(true);

  const pendingAcks = invitation.acks.filter(ack => ack.status === AckStatus.Pending);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!api) return;

      try {
        setLoadingLocations(true);
        const locationPromises = invitation.locations.map(id => api.getLocation(id));
        const locationResults = await Promise.all(locationPromises);
        const locationMap = new Map(locationResults.map(loc => [loc.id, loc]));
        setLocations(locationMap);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [api, invitation.locations]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(invitation.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete invitation:', error);
      // TODO: Implement error handling with toast notifications or error messages
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="card-title">{invitation.invitationType} Invitation</h5>
              <h6 className="card-subtitle mb-2 text-muted">
                Skill Level: {invitation.skillLevel}
              </h6>
            </div>
            <div className="d-flex gap-2">
              {pendingAcks.length > 0 && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowConfirmModal(true)}
                >
                  Review Responses ({pendingAcks.length})
                </button>
              )}
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2">
              <strong>Available Locations:</strong>
              {loadingLocations ? (
                <div className="text-muted">Loading locations...</div>
              ) : (
                <ul className="list-unstyled">
                  {invitation.locations.map(id => {
                    const location = locations.get(id);
                    return (
                      <li key={id}>
                        {location ? (
                          <span>
                            {location.name}
                            {location.address && (
                              <small className="text-muted ms-2">
                                <i className="bi bi-geo-alt me-1"></i>
                                {location.address}
                              </small>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">Unknown location</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <strong>Available Time Slots:</strong>
              <ul className="list-unstyled">
                {invitation.timeSlots.map((slot, index) => (
                  <li key={index}>
                    {slot.date.toLocaleDateString()} at {String(slot.time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {invitation.description && (
            <div className="mt-3">
              <strong>Description:</strong>
              <p className="mb-0">{invitation.description}</p>
            </div>
          )}

          {pendingAcks.length > 0 && (
            <div className="mt-3">
              <strong>Pending Responses:</strong>
              <ul className="list-unstyled">
                {pendingAcks.map((ack, index) => (
                  <li key={index} className="mt-2">
                    <div className="d-flex align-items-start">
                      <i className="bi bi-person-circle text-primary me-2 fs-5"></i>
                      <div>
                        <div><strong>{ack.userId}</strong></div>
                        <div className="text-muted small">
                          {ack.locations.length} location{ack.locations.length !== 1 ? 's' : ''} • {' '}
                          {ack.timeSlots.length} time slot{ack.timeSlots.length !== 1 ? 's' : ''}
                        </div>
                        {ack.comment && (
                          <div className="text-muted small mt-1">
                            <i className="bi bi-chat-left-text me-1"></i>
                            {ack.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 text-muted">
            <small>Posted on {invitation.createdAt.toLocaleString()}</small>
          </div>
        </div>
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5">
            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
            Cancel Invitation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p>Are you sure you want to cancel this invitation?</p>
          <p className="text-muted mb-0">
            <i className="bi bi-info-circle me-2"></i>
            All players who have responded will be notified.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <button
            className="btn btn-link text-decoration-none"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Keep Invitation
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cancelling...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Yes, Cancel Invitation
              </>
            )}
          </button>
        </Modal.Footer>
      </Modal>

      {showConfirmModal && (
        <ConfirmInvitationModal
          invitation={invitation}
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false);
            window.location.reload(); // Refresh to show updated state
          }}
        />
      )}
    </>
  );
};

export default MyInvitationItem; 
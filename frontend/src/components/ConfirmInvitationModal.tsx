import React, { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { Invitation, AckStatus } from '../services/domain/invitation';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAck, setSelectedAck] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; time: number } | null>(null);

  const pendingAcks = invitation.acks.filter(ack => ack.status === AckStatus.Pending);

  const handleConfirm = async () => {
    try {
      if (!selectedAck || !selectedLocation || !selectedTimeSlot) {
        throw new Error('Please select a response, location, and time slot');
      }

      setLoading(true);
      setError(null);

      await api.confirmInvitation({
        invitationId: invitation.id,
        location: selectedLocation,
        date: selectedTimeSlot.date,
        time: selectedTimeSlot.time,
        duration: invitation.sessionDuration,
        playerBId: selectedAck
      });

      onConfirm();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAckSelect = (ackUserId: string) => {
    setSelectedAck(ackUserId);
    setSelectedLocation('');
    setSelectedTimeSlot(null);
  };

  const getAvailableLocations = () => {
    if (!selectedAck) return [];
    const ack = pendingAcks.find(a => a.userId === selectedAck);
    return ack ? ack.locations : [];
  };

  const getAvailableTimeSlots = () => {
    if (!selectedAck) return [];
    const ack = pendingAcks.find(a => a.userId === selectedAck);
    return ack ? ack.timeSlots : [];
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Confirm Tennis Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">
            <i className="bi bi-people me-2 text-primary"></i>
            Select a Response
          </h6>
          <div className="list-group">
            {pendingAcks.map(ack => (
              <button
                key={ack.userId}
                type="button"
                className={`list-group-item list-group-item-action ${selectedAck === ack.userId ? 'active' : ''}`}
                onClick={() => handleAckSelect(ack.userId)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{ack.userId}</h6>
                    <p className="mb-1 small">
                      {ack.locations.length} location{ack.locations.length !== 1 ? 's' : ''} • {' '}
                      {ack.timeSlots.length} time slot{ack.timeSlots.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="badge bg-primary rounded-pill">
                    <i className="bi bi-check2"></i>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedAck && (
          <>
            <div className="mb-4">
              <h6 className="mb-3">
                <i className="bi bi-geo-alt me-2 text-primary"></i>
                Select Location
              </h6>
              <Form.Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Choose a location...</option>
                {getAvailableLocations().map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="mb-4">
              <h6 className="mb-3">
                <i className="bi bi-clock me-2 text-primary"></i>
                Select Time Slot
              </h6>
              <div className="list-group">
                {getAvailableTimeSlots().map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`list-group-item list-group-item-action ${
                      selectedTimeSlot?.date.getTime() === slot.date.getTime() &&
                      selectedTimeSlot?.time === slot.time
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => setSelectedTimeSlot(slot)}
                  >
                    {format(slot.date, 'EEEE, MMMM d, yyyy')} at{' '}
                    {String(slot.time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-link text-decoration-none"
          onClick={onHide}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={loading || !selectedAck || !selectedLocation || !selectedTimeSlot}
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
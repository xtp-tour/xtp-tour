import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { AcceptanceOptions, AckInvitationRequest } from '../services/api/types';
import { useAPI } from '../services/api/provider';
import TimeSlotLabels from './TimeSlotLabels';
import { InvitationFlowDiagram } from './InvitationFlowDiagram';
import { InvitationStep } from '/Users/denis.palnitsky/go/src/github.com/xtp-tour/xtp-tour/frontend/src/components/invitation/types';
import { Invitation } from '../services/domain/invitation';

interface Props {
  invitation: Invitation;
  show: boolean;
  onHide: () => void;
}

export const AcceptInvitationModal: React.FC<Props> = ({
  invitation,
  show,
  onHide
}) => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<AcceptanceOptions | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{
    date: Date;
    time: number;
  }[]>([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getAcceptanceOptions(invitation.id);
        setOptions(response);
        // Pre-select first location by default
        if (response.locations.length > 0) {
          setSelectedLocations([response.locations[0]]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load options');
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchOptions();
    }
  }, [api, invitation.id, show]);

  const handleLocationChange = (locationId: string, checked: boolean) => {
    setSelectedLocations(prev => 
      checked 
        ? [...prev, locationId]
        : prev.filter(id => id !== locationId)
    );
  };

  const handleTimeSlotChange = (slot: { date: Date | string; time: number }) => {
    const date = slot.date instanceof Date ? slot.date : new Date(slot.date);
    const isSelected = selectedTimeSlots.some(
      s => s.date.getTime() === date.getTime() && s.time === slot.time
    );

    setSelectedTimeSlots(prev =>
      isSelected
        ? prev.filter(s => !(s.date.getTime() === date.getTime() && s.time === slot.time))
        : [...prev, { date, time: slot.time }]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedLocations.length === 0) {
        throw new Error('Please select at least one location');
      }

      if (selectedTimeSlots.length === 0) {
        throw new Error('Please select at least one time slot');
      }

      const request: AckInvitationRequest = {
        invitationId: invitation.id,
        locations: selectedLocations,
        timeSlots: selectedTimeSlots,
        comment: comment.trim() || undefined
      };

      await api.ackInvitation(request);
      onHide();
      window.location.reload(); // Refresh to show updated state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4">
          <i className="bi bi-calendar2-check me-2 text-primary"></i>
          Join {invitation.ownerId}'s {invitation.invitationType}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <InvitationFlowDiagram
          currentStep={InvitationStep.Pending}
          hostName={invitation.ownerId}
          className="mb-4"
        />

        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-0">Loading available options...</p>
          </div>
        ) : options ? (
          <Form>
            <div className="card mb-4">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>
                  Where would you like to play?
                </h6>
                <div className="ps-2">
                  <div className="d-flex flex-wrap gap-2">
                    {options.locations.map(locationId => (
                      <div
                        key={locationId}
                        className={`badge p-2 ${
                          selectedLocations.includes(locationId)
                            ? 'bg-success text-white'
                            : 'bg-light text-dark border border-primary border-opacity-25'
                        }`}
                        onClick={() => handleLocationChange(
                          locationId,
                          !selectedLocations.includes(locationId)
                        )}
                        role="button"
                        style={{ cursor: 'pointer' }}
                      >
                        <i className={`bi bi-geo-alt me-1 ${
                          selectedLocations.includes(locationId) ? 'text-white' : 'text-primary'
                        }`}></i>
                        {locationId}
                      </div>
                    ))}
                  </div>
                  <small className="text-muted d-block mt-2 ps-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Select all locations where you can play.
                  </small>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-clock me-2 text-primary"></i>
                  When would you like to start?
                </h6>
                <div className="ps-2">
                  <TimeSlotLabels
                    timeSlots={options.timeSlots.map(slot => ({
                      date: new Date(slot.date),
                      time: slot.time,
                      isSelected: selectedTimeSlots.some(
                        s => s.date.getTime() === new Date(slot.date).getTime() && s.time === slot.time
                      ),
                      isAvailable: slot.isAvailable
                    }))}
                    onSelect={handleTimeSlotChange}
                    className="mb-2"
                  />
                  <small className="text-muted d-block mt-2 ps-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Select all time slots that work for you. {invitation.ownerId} will choose the final time based on your availability.
                  </small>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-chat me-2 text-primary"></i>
                  Additional Comments (Optional)
                </h6>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Add any additional information or preferences..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          </Form>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-2">
        <Button 
          variant="link" 
          onClick={onHide} 
          disabled={loading}
          className="text-decoration-none"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading || !options || selectedLocations.length === 0 || selectedTimeSlots.length === 0}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Sending...
            </>
          ) : (
            <>              
              Send Response
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}; 
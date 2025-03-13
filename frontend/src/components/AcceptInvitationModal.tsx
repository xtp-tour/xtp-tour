import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { AcceptanceOptions, AcceptInvitationRequest } from '../services/api/types';
import { useAPI } from '../services/api/provider';
import TimeSlotLabels from './TimeSlotLabels';
import { InvitationFlowDiagram, InvitationStep } from './InvitationFlowDiagram';

interface Props {
  invitationId: string;
  hostName: string;
  show: boolean;
  onHide: () => void;
  onAccepted: () => void;
}

export const AcceptInvitationModal: React.FC<Props> = ({
  invitationId,
  hostName,
  show,
  onHide,
  onAccepted
}) => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<AcceptanceOptions | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{
    date: string;
    startTime: number;
  }[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getAcceptanceOptions(invitationId);
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
  }, [api, invitationId, show]);

  const handleLocationChange = (locationId: string, checked: boolean) => {
    setSelectedLocations(prev => 
      checked 
        ? [...prev, locationId]
        : prev.filter(id => id !== locationId)
    );
  };

  const handleTimeSlotChange = (slot: { date: Date | string; time: number }) => {
    const dateStr = slot.date instanceof Date ? slot.date.toISOString().split('T')[0] : slot.date;
    const isSelected = selectedTimeSlots.some(
      s => s.date === dateStr && s.startTime === slot.time
    );

    setSelectedTimeSlots(prev =>
      isSelected
        ? prev.filter(s => !(s.date === dateStr && s.startTime === slot.time))
        : [...prev, { date: dateStr, startTime: slot.time }]
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

      const request: AcceptInvitationRequest = {
        id: invitationId,
        selectedLocations,
        selectedTimeSlots
      };

      await api.acceptInvitation(request);
      onAccepted();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4">
          <i className="bi bi-calendar2-check me-2 text-primary"></i>
          Join {hostName}'s Game Session
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <InvitationFlowDiagram
          currentStep={InvitationStep.Pending}
          hostName={hostName}
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

            <div className="card">
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
                        s => s.date === slot.date && s.startTime === slot.time
                      ),
                      isAvailable: slot.isAvailable
                    }))}
                    onSelect={handleTimeSlotChange}
                    className="mb-2"
                  />
                  <small className="text-muted d-block mt-2 ps-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Select all time slots that work for you. {hostName} will choose the final time based on your availability.
                  </small>
                </div>
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
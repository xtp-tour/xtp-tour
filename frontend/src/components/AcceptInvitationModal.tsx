import React, { useEffect, useState, ChangeEvent } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { AcceptanceOptions, AcceptInvitationRequest, TimeSlotOption } from '../types/api';
import { useAPI } from '../services/apiProvider';
import { formatTime } from '../utils/dateUtils';
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

  const handleTimeSlotChange = (slot: TimeSlotOption, checked: boolean) => {
    setSelectedTimeSlots(prev =>
      checked
        ? [...prev, { date: slot.date, startTime: slot.time }]
        : prev.filter(s => !(s.date === slot.date && s.startTime === slot.time))
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

  const groupTimeSlotsByDate = (slots: TimeSlotOption[]) => {
    const grouped = new Map<string, TimeSlotOption[]>();
    slots.forEach(slot => {
      const existing = grouped.get(slot.date) || [];
      grouped.set(slot.date, [...existing, slot]);
    });
    return grouped;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Accept Invitation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InvitationFlowDiagram
          currentStep={InvitationStep.Pending}
          hostName={hostName}
          className="mb-4"
        />

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : options ? (
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold d-flex align-items-center">
                <i className="bi bi-geo-alt me-2"></i>
                Select Locations That Work for You
              </Form.Label>
              <div className="ps-4">
                {options.locations.map(locationId => (
                  <Form.Check
                    key={locationId}
                    type="checkbox"
                    id={`location-${locationId}`}
                    label={locationId} // In real app, fetch location names
                    checked={selectedLocations.includes(locationId)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleLocationChange(locationId, e.target.checked)}
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold d-flex align-items-center">
                <i className="bi bi-clock me-2"></i>
                Select Time Slots That Work for You
              </Form.Label>
              {Array.from(groupTimeSlotsByDate(options.timeSlots)).map(([date, slots]) => (
                <div key={date} className="mb-3 ps-4">
                  <h6 className="mb-2">
                    <i className="bi bi-calendar-event me-2"></i>
                    {new Date(date).toLocaleDateString()}
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {slots.map(slot => (
                      <Form.Check
                        key={`${slot.date}-${slot.time}`}
                        type="checkbox"
                        inline
                        id={`slot-${slot.date}-${slot.time}`}
                        label={formatTime(slot.time)}
                        disabled={!slot.isAvailable}
                        checked={selectedTimeSlots.some(
                          s => s.date === slot.date && s.startTime === slot.time
                        )}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleTimeSlotChange(slot, e.target.checked)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </Form.Group>
          </Form>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
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
              Sending Response...
            </>
          ) : (
            <>
              <i className="bi bi-check2 me-2"></i>
              Accept Invitation
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}; 
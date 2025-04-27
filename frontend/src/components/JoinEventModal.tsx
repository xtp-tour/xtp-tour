import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useAPI, JoinEventRequest, Event } from '../services/apiProvider';
import TimeSlotLabels from './TimeSlotLabels';
import { EventFlowDiagram, EventStep } from './EventFlowDiagram';
import { TimeSlot } from './event/types';
import moment from 'moment';

interface Props {
  eventId: string;
  hostName: string;
  show: boolean;
  onHide: () => void;
  onJoined: () => void;
}

interface JoinOptions {
  locations: string[];
  timeSlots: TimeSlot[];
}

export const JoinEventModal: React.FC<Props> = ({
  eventId,
  hostName,
  show,
  onHide,
  onJoined
}) => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<JoinOptions | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getEvent(eventId);
        if (response) {
          const event = response as Event;
          if (event) {
            const timeSlots: TimeSlot[] = event.timeSlots.map(slot => ({
              date: moment(slot),
              isAvailable: true,
              isSelected: false
            }));
            setOptions({
              locations: event.locations,
              timeSlots
            });
            // Pre-select first location by default
            if (event.locations.length > 0) {
              setSelectedLocations([event.locations[0]]);
            }
          }
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
  }, [api, eventId, show]);

  const handleLocationChange = (locationId: string, checked: boolean) => {
    setSelectedLocations(prev => 
      checked 
        ? [...prev, locationId]
        : prev.filter(id => id !== locationId)
    );
  };

  const handleTimeSlotChange = (slot: TimeSlot) => {
    setSelectedTimeSlots(prev =>
      prev.some(s => s.date.isSame(slot.date))
        ? prev.filter(s => !s.date.isSame(slot.date))
        : [...prev, slot]
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

      const request: JoinEventRequest = {
        joinRequest: {
          id: eventId,
          locations: selectedLocations,
          timeSlots: selectedTimeSlots.map(slot => slot.date.utc().format())
        }
      };

      await api.joinEvent(eventId, request);
      onJoined();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4">
          <i className="bi bi-calendar2-check me-2" style={{ color: 'var(--tennis-accent)' }}></i>
          <span style={{ color: 'var(--tennis-navy)' }}>Join {hostName}'s Game Session</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <EventFlowDiagram
          currentStep={EventStep.Pending}
          hostName={hostName}
          className="mb-4"
        />

        {error && (
          <Alert variant="danger" className="mb-3" style={{ 
            backgroundColor: '#FFF5F5', 
            borderColor: 'var(--tennis-clay)',
            color: 'var(--tennis-clay)'
          }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border mb-2" style={{ color: 'var(--tennis-navy)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-0">Loading available options...</p>
          </div>
        ) : options ? (
          <Form>
            <div className="card mb-4">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-geo-alt me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>Where would you like to play?</span>
                </h6>
                <div className="ps-2">
                  <div className="d-flex flex-wrap gap-2">
                    {options.locations.map(locationId => (
                      <div
                        key={locationId}
                        className={`badge p-2 ${
                          selectedLocations.includes(locationId)
                            ? 'text-white'
                            : 'text-dark border border-opacity-25'
                        }`}
                        style={{
                          backgroundColor: selectedLocations.includes(locationId) 
                            ? 'var(--tennis-navy)' 
                            : 'var(--tennis-light)',
                          borderColor: selectedLocations.includes(locationId)
                            ? 'var(--tennis-navy)'
                            : 'var(--tennis-navy)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleLocationChange(
                          locationId,
                          !selectedLocations.includes(locationId)
                        )}
                        role="button"
                      >
                        <i className={`bi bi-geo-alt me-1 ${
                          selectedLocations.includes(locationId) 
                            ? 'text-white' 
                            : ''
                        }`} style={{ 
                          color: selectedLocations.includes(locationId) 
                            ? 'var(--tennis-white)' 
                            : 'var(--tennis-navy)' 
                        }}></i>
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
                  <i className="bi bi-clock me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>When would you like to start?</span>
                </h6>
                <div className="ps-2">
                  <TimeSlotLabels
                    timeSlots={options.timeSlots.map(slot => ({
                      ...slot,
                      isSelected: selectedTimeSlots.some(s => s.date.isSame(slot.date))
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
          style={{ color: 'var(--tennis-gray)' }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !options}
          style={{ backgroundColor: 'var(--tennis-navy)', borderColor: 'var(--tennis-navy)' }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Submitting...
            </>
          ) : (
            <>
              <i className="bi bi-calendar2-check me-2"></i>
              Join Game Session
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}; 
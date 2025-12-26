import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAPI } from '../services/apiProvider';
import { components } from '../types/schema';
import { formatTimeSlotLocalized } from '../utils/i18nDateUtils';
import UserDisplay from './UserDisplay';
import { BADGE_STYLES } from '../styles/badgeStyles';

type ApiEvent = components['schemas']['ApiEvent'];
type ConfirmEventRequest = components['schemas']['ConfirmEvent-FmInput'];

interface Props {
  event: ApiEvent;
  show: boolean;
  onHide: () => void;
  onConfirmed: () => void;
}

interface AvailabilityMap {
  [locationId: string]: {
    [timeSlot: string]: string[]; // array of user IDs available at this location and time
  };
}

export const ConfirmEventModal: React.FC<Props> = ({
  event: initialEvent,
  show,
  onHide,
  onConfirmed
}) => {
  const { t } = useTranslation();
  const api = useAPI();
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');
  const [selectedJoinRequests, setSelectedJoinRequests] = useState<string[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap>({});
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Create Zod schema dynamically based on expected players
  const createConfirmEventSchema = (expectedPlayers: number) => {
    const requiredPlayers = expectedPlayers - 1;
    return z.object({
      selectedJoinRequests: z.array(z.string()).length(
        requiredPlayers,
        t('confirmEvent.errors.selectPlayers', { count: requiredPlayers })
      ),
      selectedLocation: z.string().min(1, t('confirmEvent.errors.selectLocation')),
      selectedDateTime: z.string().min(1, t('confirmEvent.errors.selectTimeSlot')),
    });
  };

  // Form validation using Zod
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    if (!event) {
      return { isValid: false, errors: { event: t('confirmEvent.errors.eventMissing') } };
    }

    const schema = createConfirmEventSchema(event.expectedPlayers || 0);
    const result = schema.safeParse({
      selectedJoinRequests,
      selectedLocation,
      selectedDateTime,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  };

  // Fetch latest event data when modal is shown
  useEffect(() => {
    if (show && initialEvent?.id) {
      const fetchEventData = async () => {
        try {
          setFetchingEvent(true);
          setError(null);
          const eventId = initialEvent.id;
          if (!eventId) {
            throw new Error('Event ID is missing');
          }
          const latestEvent = await api.getEvent(eventId);
          console.log('Fetched latest event data:', latestEvent);
          setEvent(latestEvent);
        } catch (err) {
          console.error('Failed to fetch latest event data:', err);
          setError('Failed to fetch latest event data. Using cached data instead.');
          setEvent(initialEvent);
        } finally {
          setFetchingEvent(false);
        }
      };

      fetchEventData();
    } else if (!show) {
      // Reset state when modal is closed
      setSelectedLocation('');
      setSelectedDateTime('');
      setSelectedJoinRequests([]);
    }
  }, [show, initialEvent?.id, api, initialEvent]);

  // Calculate valid combinations of location and time slots based on join requests
  useEffect(() => {
    if (!event || !event.joinRequests || event.joinRequests.length === 0) return;

    const map: AvailabilityMap = {};

    // Initialize the map
    if (event.locations && event.locations.length > 0) {
      event.locations.forEach(locationId => {
        map[locationId] = {};
        if (event.timeSlots && event.timeSlots.length > 0) {
          event.timeSlots.forEach(timeSlot => {
            map[locationId][timeSlot] = [];
          });
        }
      });
    }

    // Fill the map with user availabilities
    event.joinRequests.forEach(request => {
      // Include requests that are not rejected
      if (request.isRejected !== true) {
        if (request.locations && request.locations.length > 0) {
          request.locations.forEach(locationId => {
            if (request.timeSlots && request.timeSlots.length > 0) {
              request.timeSlots.forEach(timeSlot => {
                if (map[locationId] && map[locationId][timeSlot]) {
                  map[locationId][timeSlot].push(request.userId || '');
                }
              });
            }
          });
        }
      }
    });

    console.log('Availability map:', map);
    setAvailabilityMap(map);
  }, [event]);

  // Update available locations when selected join requests change
  useEffect(() => {
    if (!event || !availabilityMap || Object.keys(availabilityMap).length === 0) return;

    // If no join requests are selected, show all locations
    if (selectedJoinRequests.length === 0) {
      setAvailableLocations(event.locations || []);
      return;
    }

    // Find locations where all selected players are available for at least one time slot
    const compatibleLocations = event.locations?.filter(locationId => {
      if (!availabilityMap[locationId]) return false;

      // Check if this location has at least one time slot where all selected players are available
      const hasCompatibleTimeSlot = Object.entries(availabilityMap[locationId]).some(([, userIds]) => {
        return selectedJoinRequests.every(requestId => {
          const request = event.joinRequests?.find(r => r.id === requestId);
          // Check if the user ID from the request is in the list of available users for this time slot
          return request && userIds.includes(request.userId || '');
        });
      });

      return hasCompatibleTimeSlot;
    }) || [];

    console.log('Selected join requests:', selectedJoinRequests);
    console.log('Compatible locations:', compatibleLocations);

    setAvailableLocations(compatibleLocations);

    // Clear selected location if it's no longer available
    if (selectedLocation && !compatibleLocations.includes(selectedLocation)) {
      setSelectedLocation('');
      setSelectedDateTime('');
    }
  }, [selectedJoinRequests, availabilityMap, event?.locations, event?.joinRequests, event, selectedLocation]);

  // Update available time slots when location or selected join requests change
  useEffect(() => {
    if (!event || !selectedLocation || !availabilityMap[selectedLocation]) return;

    // Find time slots where all selected join requests are available
    const timeSlots = Object.keys(availabilityMap[selectedLocation]).filter(timeSlot => {
      const availableUsers = availabilityMap[selectedLocation][timeSlot];

      // If we haven't selected any join requests yet, show all time slots
      if (selectedJoinRequests.length === 0) return true;

      // Check if all selected join requests are available for this time slot
      return selectedJoinRequests.every(requestId => {
        const request = event.joinRequests?.find(r => r.id === requestId);
        return request && availableUsers.includes(request.userId || '');
      });
    });

    console.log('Available time slots for location', selectedLocation, ':', timeSlots);
    setAvailableTimeSlots(timeSlots);

    // Clear selected date time if it's no longer available
    if (selectedDateTime && !timeSlots.includes(selectedDateTime)) {
      setSelectedDateTime('');
    }
  }, [selectedLocation, selectedJoinRequests, availabilityMap, event?.joinRequests, event, selectedDateTime]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
    setSelectedDateTime(''); // Reset time slot when location changes
    // Clear location validation error
    if (validationErrors.selectedLocation) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.selectedLocation;
        return newErrors;
      });
    }
  };

  const handleDateTimeChange = (dateTime: string) => {
    setSelectedDateTime(dateTime);
    // Clear datetime validation error
    if (validationErrors.selectedDateTime) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.selectedDateTime;
        return newErrors;
      });
    }
  };

  const handleJoinRequestChange = (requestId: string, checked: boolean) => {
    setSelectedJoinRequests(prev =>
      checked
        ? [...prev, requestId]
        : prev.filter(id => id !== requestId)
    );
    // Clear join requests validation error
    if (validationErrors.selectedJoinRequests) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.selectedJoinRequests;
        return newErrors;
      });
    }
  };

  // Check if a user has any available locations and time slots
  const userHasAvailability = (userId: string) => {
    if (!availabilityMap || Object.keys(availabilityMap).length === 0) return false;

    // Check each location
    for (const locationId in availabilityMap) {
      // Check each time slot in this location
      for (const timeSlot in availabilityMap[locationId]) {
        // If the user is available at this location and time
        if (availabilityMap[locationId][timeSlot].includes(userId)) {
          return true;
        }
      }
    }

    return false;
  };

  const handleConfirm = async () => {
    setError(null);

    // Validate form before submission
    const validation = validateForm();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Combine all error messages for the general error display
      const errorMessage = Object.values(validation.errors).join('. ');
      setError(errorMessage);
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});

    try {
      setLoading(true);

      const request: ConfirmEventRequest = {
        datetime: selectedDateTime,
        locationId: selectedLocation,
        joinRequestsIds: selectedJoinRequests
      };

      await api.confirmEvent(event!.id || '', request);
      onConfirmed();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('confirmEvent.errors.failedToConfirm'));
    } finally {
      setLoading(false);
    }
  };

  const getValidJoinRequests = () => {
    if (!event || !event.joinRequests) return [];

    const validRequests = event.joinRequests.filter(request => {
      // Include requests that are not rejected (either null or false)
      return request.isRejected !== true;
    });

    // Log availability for debugging
    validRequests.forEach(request => {
      console.log(`User ${request.userId} has isRejected:`, request.isRejected);
      console.log(`User ${request.userId} has availability:`, userHasAvailability(request.userId || ''));
      if (request.locations) {
        console.log(`User ${request.userId} locations:`, request.locations);
      }
      if (request.timeSlots) {
        console.log(`User ${request.userId} time slots:`, request.timeSlots);
      }
    });

    return validRequests;
  };

  // Get count of compatible locations for the selected players
  const getCompatibleLocationsCount = () => {
    return availableLocations.length;
  };

  // Get count of time slots that are compatible with selected join requests and location
  const getCompatibleTimeSlotsCount = () => {
    return availableTimeSlots.length;
  };

  // Using utility function to format time slot (converts UTC to local)

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4">
          <i className="bi bi-calendar-check me-2" style={{ color: 'var(--tennis-accent)' }}></i>
          <span style={{ color: 'var(--tennis-navy)' }}>Confirm Your Event</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
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

        {fetchingEvent ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Fetching latest event data...</p>
          </div>
        ) : !event ? (
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Event data is missing. Please try again later.
          </Alert>
        ) : (
          <Form>
            {/* Join Requests Section */}
            <div className="card mb-4">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-people me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>
                    {t('confirmEvent.selectPlayers', { selected: selectedJoinRequests.length, required: (event.expectedPlayers || 0) - 1 })}
                  </span>
                </h6>
                {validationErrors.selectedJoinRequests && (
                  <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                    <small><i className="bi bi-exclamation-triangle me-1"></i>
                    {validationErrors.selectedJoinRequests}</small>
                  </div>
                )}

                {getValidJoinRequests().length === 0 ? (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    No players have requested to join this event yet.
                  </div>
                ) : (
                  <div className="list-group">
                    {getValidJoinRequests().map(request => {
                      const hasAvailability = userHasAvailability(request.userId || '');
                      return (
                        <div
                          key={request.id}
                          className="list-group-item list-group-item-action"
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <UserDisplay
                                userId={request.userId || ''}
                                fallback="Unknown Player"
                              />
                              {request.comment && (
                                <p className="text-muted mb-0 small">
                                  <i className="bi bi-chat-dots me-1"></i>
                                  {request.comment}
                                </p>
                              )}
                              {!hasAvailability && (
                                <p className="text-danger mb-0 small">
                                  <i className="bi bi-exclamation-triangle me-1"></i>
                                  This player hasn't specified any available times or locations.
                                </p>
                              )}
                            </div>
                            <Form.Check
                              type="checkbox"
                              id={`request-${request.id}`}
                              checked={selectedJoinRequests.includes(request.id || '')}
                              onChange={(e) => handleJoinRequestChange(request.id || '', e.target.checked)}
                              disabled={!hasAvailability}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <small className="text-muted d-block mt-2 ps-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Select {(event.expectedPlayers || 0) - 1} players to participate in your event.
                </small>
              </div>
            </div>

            {/* Location Section */}
            <div className="card mb-4">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-geo-alt me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>
                    {t('confirmEvent.selectLocation', { count: getCompatibleLocationsCount() })}
                  </span>
                </h6>
                {validationErrors.selectedLocation && (
                  <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                    <small><i className="bi bi-exclamation-triangle me-1"></i>
                    {validationErrors.selectedLocation}</small>
                  </div>
                )}
                <div className="ps-2">
                  {availableLocations.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {availableLocations.map(locationId => (
                        <div
                          key={locationId}
                          className={`badge ${
                            selectedLocation === locationId
                              ? 'text-white'
                              : 'text-dark border border-opacity-25'
                          }`}
                          style={{
                            ...BADGE_STYLES,
                            backgroundColor: selectedLocation === locationId
                              ? 'var(--tennis-navy)'
                              : 'var(--tennis-light)',
                            borderColor: selectedLocation === locationId
                              ? 'var(--tennis-navy)'
                              : 'var(--tennis-navy)',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleLocationChange(locationId)}
                          role="button"
                        >
                          <i className={`bi bi-geo-alt me-1 ${
                            selectedLocation === locationId
                              ? 'text-white'
                              : ''
                          }`} style={{
                            color: selectedLocation === locationId
                              ? 'var(--tennis-white)'
                              : 'var(--tennis-navy)'
                          }}></i>
                          {locationId}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {selectedJoinRequests.length > 0
                        ? "No compatible locations found for the selected players."
                        : "Please select players to see available locations."}
                    </div>
                  )}
                  <small className="text-muted d-block mt-2 ps-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Select a location that works for your selected players.
                  </small>
                </div>
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="card">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-clock me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>
                    {t('confirmEvent.selectTime', { count: getCompatibleTimeSlotsCount() })}
                  </span>
                </h6>
                {validationErrors.selectedDateTime && (
                  <div className="alert alert-danger alert-sm py-1 px-2 mb-2" role="alert">
                    <small><i className="bi bi-exclamation-triangle me-1"></i>
                    {validationErrors.selectedDateTime}</small>
                  </div>
                )}
                <div className="ps-2">
                  {availableTimeSlots.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {availableTimeSlots.map(timeSlot => (
                        <div
                          key={timeSlot}
                          className={`badge ${
                            selectedDateTime === timeSlot
                              ? 'text-white'
                              : 'text-dark border border-opacity-25'
                          }`}
                          style={{
                            ...BADGE_STYLES,
                            backgroundColor: selectedDateTime === timeSlot
                              ? 'var(--tennis-navy)'
                              : 'var(--tennis-light)',
                            borderColor: selectedDateTime === timeSlot
                              ? 'var(--tennis-navy)'
                              : 'var(--tennis-navy)',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleDateTimeChange(timeSlot)}
                          role="button"
                        >
                          <i className={`bi bi-clock me-1 ${
                            selectedDateTime === timeSlot
                              ? 'text-white'
                              : ''
                          }`} style={{
                            color: selectedDateTime === timeSlot
                              ? 'var(--tennis-white)'
                              : 'var(--tennis-navy)'
                          }}></i>
                          {formatTimeSlotLocalized(timeSlot)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {selectedLocation
                        ? "No compatible time slots found for the selected players and location."
                        : "Please select a location to see available time slots."}
                    </div>
                  )}
                  <small className="text-muted d-block mt-2 ps-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Select a time slot that works for all selected players at the chosen location.
                  </small>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-2">
        <Button
          variant="link"
          onClick={onHide}
          disabled={loading || fetchingEvent}
          className="text-decoration-none"
          style={{ color: 'var(--tennis-gray)' }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={
            loading ||
            fetchingEvent ||
            !event ||
            !selectedLocation ||
            !selectedDateTime ||
            selectedJoinRequests.length !== (event?.expectedPlayers || 0) - 1
          }
          style={{ backgroundColor: 'var(--tennis-navy)', borderColor: 'var(--tennis-navy)' }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Confirming...
            </>
          ) : (
            <>Confirm Event</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmEventModal;
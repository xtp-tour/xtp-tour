import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAPI, JoinEventRequest, Event } from '../services/apiProvider';
import TimeSlotLabels from './event/TimeSlotLabels';
import { EventFlowDiagram } from './EventFlowDiagram';
import { EventStep } from '../types/eventTypes';
import { TimeSlot } from './event/types';
import moment from 'moment';
import { BADGE_STYLES } from '../styles/badgeStyles';
import { ApiUserProfileData } from '../types/api';

interface Props {
  eventId: string;
  userId: string;
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
  userId,
  show,
  onHide,
  onJoined
}) => {
  const { t } = useTranslation();
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<JoinOptions | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [hostProfile, setHostProfile] = useState<ApiUserProfileData | null>(null);

  // Function to get display name (reused from HostDisplay)
  const getDisplayName = (): string => {
    if (!hostProfile) {
      return t('host.unknown');
    }

    // Use first name + last name
    if (hostProfile.firstName && hostProfile.lastName) {
      return `${hostProfile.firstName} ${hostProfile.lastName}`;
    }

    // Fallback to just first name if available
    if (hostProfile.firstName) {
      return hostProfile.firstName;
    }

    // Fallback to just last name if available
    if (hostProfile.lastName) {
      return hostProfile.lastName;
    }

    return t('host.unknown');
  };

  // Fetch host profile
  useEffect(() => {
    const fetchHostProfile = async () => {
      try {
        const response = await api.getUserProfileByUserId(userId);
        setHostProfile(response.profile || null);
      } catch (err) {
        console.warn(`Failed to fetch profile for user ${userId}:`, err);
        setHostProfile(null);
      }
    };

    if (userId && show) {
      fetchHostProfile();
    }
  }, [userId, api, show]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getPublicEvent(eventId);
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
            // Clear any previous selections when loading new event
            setSelectedLocations([]);
            setSelectedTimeSlots([]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('joinModal.failedToLoadOptions'));
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchOptions();
    }
  }, [api, eventId, show, t]);

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
        throw new Error(t('joinModal.selectLocation'));
      }

      if (selectedTimeSlots.length === 0) {
        throw new Error(t('joinModal.selectTimeSlot'));
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
      setError(err instanceof Error ? err.message : t('joinModal.failedToJoin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4">
          <i className="bi bi-calendar2-check me-2" style={{ color: 'var(--tennis-accent)' }}></i>
          <span style={{ color: 'var(--tennis-navy)' }}>{t('joinModal.title', { displayName: getDisplayName() })}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <EventFlowDiagram
          currentStep={EventStep.Pending}
          hostName={getDisplayName()}
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
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <p className="text-muted mb-0">{t('joinModal.loadingText')}</p>
          </div>
        ) : options ? (
          <Form>
            <div className="card mb-4">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-geo-alt me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>{t('joinModal.whereToPlay')}</span>
                </h6>
                <div className="ps-2">
                  <div className="d-flex flex-wrap gap-2">
                    {options.locations.map(locationId => (
                      <div
                        key={locationId}
                        className={`badge ${
                          selectedLocations.includes(locationId)
                            ? 'text-white'
                            : 'text-dark border border-opacity-25'
                        }`}
                        style={{
                          ...BADGE_STYLES,
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
                    {t('joinModal.locationHelp')}
                  </small>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h6 className="card-title d-flex align-items-center mb-3">
                  <i className="bi bi-clock me-2" style={{ color: 'var(--tennis-accent)' }}></i>
                  <span style={{ color: 'var(--tennis-navy)' }}>{t('joinModal.whenToStart')}</span>
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
                    {t('joinModal.timeSlotHelp', { displayName: getDisplayName() })}
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
          {t('common.cancel')}
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
              {t('joinModal.submitting')}
            </>
          ) : (
            <>
              <i className="bi bi-calendar2-check me-2"></i>
              {t('joinModal.joinGameSession')}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
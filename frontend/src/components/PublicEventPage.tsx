import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../services/apiProvider';
import { ApiEvent } from '../types/api';
import { JoinEventModal } from './JoinEventModal';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import UserDisplay from './UserDisplay';
import { SignedOut, SignInButton } from '@clerk/clerk-react';
import Toast from './Toast';

const PublicEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const api = useAPI();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const eventData = await api.getPublicEvent(eventId);
      setEvent(eventData);
    } catch {
      setError('Event not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = () => {
    setShowJoinModal(true);
  };

  const handleJoined = () => {
    setShowJoinModal(false);
    // Refresh the event data to show updated join requests
    loadEvent();
  };

  const handleBackToList = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-4">
          <div className="text-center">
            <i className="bi bi-exclamation-triangle fs-1 text-warning mb-3"></i>
            <h3>Event Not Found</h3>
            <p className="text-muted">{error || 'The event you are looking for does not exist or has been removed.'}</p>
            <button className="btn btn-primary" onClick={handleBackToList}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => 
    timeSlotFromDateAndConfirmation(slot, event.confirmation, true)
  );

  // Get action button for joining
  const getActionButton = () => ({
    variant: 'outline-primary',
    icon: 'bi-plus-circle',
    label: 'Join Event',
    onClick: handleJoinEvent
  });

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <header className="pb-3 mb-4 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3" 
                onClick={handleBackToList}
                style={{ minWidth: 'auto' }}
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h1 className="h2 mb-0" style={{ color: 'var(--tennis-navy)' }}>
                  Tennis Event
                </h1>
                <p className="text-muted mb-0">Shared by <UserDisplay userId={event.userId || ''} fallback="Unknown User" /></p>
              </div>
            </div>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn btn-primary">
                    <i className="bi bi-person-plus me-2"></i>
                    Sign in to Join
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </header>

        <main>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <BaseEventItem
                event={event}
                headerTitle="Public Event"
                headerSubtitle={
                  <div className="d-flex align-items-center">
                    <span className="me-2">
                      Host: <UserDisplay userId={event.userId || ''} fallback="Unknown User" />
                    </span>
                    <span className="badge bg-secondary">
                      {event.joinRequests?.filter(req => req.isRejected === false).length || 0} joined
                    </span>
                  </div>
                }
                colorClass="text-primary"
                borderColorClass="border-primary"
                timeSlots={timeSlots}
                timestamp={moment(event.createdAt)}
                actionButton={getActionButton()}
                defaultCollapsed={false}
              />

              <div className="mt-4 p-3 bg-white rounded border">
                <h5>Share this event</h5>
                <p className="text-muted mb-3">
                  Share this link with friends to invite them to join this tennis event!
                </p>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={window.location.href}
                    readOnly
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setShowToast(true);
                    }}
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {event.id && (
          <JoinEventModal
            eventId={event.id}
            hostName={event.userId || 'Unknown User'}
            show={showJoinModal}
            onHide={() => setShowJoinModal(false)}
            onJoined={handleJoined}
          />
        )}

        <Toast
          message="Link copied to clipboard!"
          show={showToast}
          onHide={() => setShowToast(false)}
          type="success"
        />
      </div>
    </div>
  );
};

export default PublicEventPage; 
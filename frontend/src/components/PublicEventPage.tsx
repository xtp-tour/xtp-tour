import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../services/apiProvider';
import { ApiEvent } from '../types/api';
import { JoinEventModal } from './JoinEventModal';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import UserDisplay from './UserDisplay';
import { SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import Toast from './Toast';

const PublicEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const api = useAPI();
  const { isSignedIn, user } = useUser();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const loadEvent = useCallback(async () => {
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
  }, [eventId, api]);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId, loadEvent]);

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
  const getActionButton = () => {
    if (!isSignedIn) {
      return {
        variant: 'outline-secondary',
        icon: 'bi-person-plus',
        label: 'Sign in to Join',
        onClick: () => {
          // This will be handled by the SignInButton in the header
        }
      };
    }

    // Check if user is the event owner
    const isOwner = user?.id === event?.userId;

    // Check if event is open for joining
    const isEventOpen = event?.status === 'OPEN';

    // Check if user has already joined the event (only count explicitly accepted requests)
    const hasAlreadyJoined = event?.joinRequests?.some(
      req => req.userId === user?.id && req.isRejected === false
    );

    // Hide button if user owns the event, event is not open, or user has already joined
    if (isOwner || !isEventOpen || hasAlreadyJoined) {
      return {
        variant: 'outline-primary',
        icon: 'bi-plus-circle',
        label: hasAlreadyJoined ? 'Already Joined' : 'Join Event',
        onClick: () => {},
        hidden: true
      };
    }

    return {
      variant: 'outline-primary',
      icon: 'bi-plus-circle',
      label: 'Join Event',
      onClick: handleJoinEvent
    };
  };

  // Simple user display for anonymous users
  const SimpleUserDisplay = ({ userId }: { userId: string }) => (
    <span className="text-muted">User {userId.slice(0, 8)}...</span>
  );

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
                <p className="text-muted mb-0">
                  Shared by {isSignedIn ? (
                    <UserDisplay userId={event.userId || ''} fallback="Unknown User" />
                  ) : (
                    <SimpleUserDisplay userId={event.userId || ''} />
                  )}
                </p>
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
                      Host: {isSignedIn ? (
                        <UserDisplay userId={event.userId || ''} fallback="Unknown User" />
                      ) : (
                        <SimpleUserDisplay userId={event.userId || ''} />
                      )}
                    </span>
                    <span className="badge bg-secondary">
                      {event.joinRequests?.filter(req => req.isRejected === false).length || 0} joined
                    </span>
                  </div>
                                  }
                  colorClass="text-primary"
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
                <div className="input-group mb-3">
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

                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    }}
                  >
                    <i className="bi bi-facebook me-2"></i>
                    Facebook
                  </button>

                  <button
                    className="btn btn-info"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(`Join me for a tennis event! 🎾`);
                      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                    }}
                  >
                    <i className="bi bi-twitter me-2"></i>
                    Twitter
                  </button>

                  <button
                    className="btn btn-success"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(`Join me for a tennis event! 🎾`);
                      window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                    }}
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    WhatsApp
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(`Join me for a tennis event! 🎾`);
                      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                    }}
                  >
                    <i className="bi bi-telegram me-2"></i>
                    Telegram
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {event.id && isSignedIn && (
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
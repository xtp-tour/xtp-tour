import React, { useState, useEffect } from 'react';
import { useAPI } from '../services/apiProvider';
import { ApiEvent } from '../types/api';
import { JoinEventModal } from './JoinEventModal';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import UserDisplay from './UserDisplay';
import Toast from './Toast';
import { useUser } from '@clerk/clerk-react';

interface Props {
  onEventJoined?: () => void;
}

const PublicEventList: React.FC<Props> = ({ onEventJoined }) => {
  const api = useAPI();
  const { isSignedIn, user } = useUser();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventId, setShareEventId] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.listPublicEvents();
      setEvents(response.events || []);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = (event: ApiEvent) => {
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const handleJoined = () => {
    setShowJoinModal(false);
    loadEvents(); // Refresh the list
    if (onEventJoined) {
      onEventJoined();
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <i className="bi bi-calendar-x fs-1 mb-3"></i>
        <h5>No public events available</h5>
        <p>Check back later for new events!</p>
      </div>
    );
  }

  return (
    <div>      {events.map(event => {
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
          const isOwner = user?.id === event.userId;
          
          // Check if event is open for joining
          const isEventOpen = event.status === 'OPEN';

          // Check if user has already joined the event
          const hasAlreadyJoined = event.joinRequests?.some(
            req => req.userId === user?.id && req.isRejected !== true
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
            onClick: () => handleJoinEvent(event)
          };
        };

        // Simple user display for anonymous users
        const SimpleUserDisplay = ({ userId }: { userId: string }) => (
          <span className="text-muted">User {userId.slice(0, 8)}...</span>
        );

        return (
          <div key={event.id} className="position-relative mb-3">
            <div 
              className="text-decoration-none"
              onClick={(e) => {
                // Don't navigate if clicking on the action button or dropdown
                if ((e.target as HTMLElement).closest('.btn, .dropdown-menu, .dropdown-item')) {
                  return;
                }
                window.location.href = `/event/${event.id}`;
              }}
            >
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
                borderColorClass="border-primary"
                timeSlots={timeSlots}
                timestamp={moment(event.createdAt)}
                actionButton={getActionButton()}
                defaultCollapsed={true}
              />
            </div>
            <div className="position-absolute top-0 end-0 p-2" style={{ zIndex: 1060 }}>
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShareEventId(event.id || '');
                  setShowShareModal(true);
                }}
                title="Share event"
              >
                <i className="bi bi-share"></i>
              </button>
            </div>
          </div>
        );
      })}

      {selectedEvent && selectedEvent.id && isSignedIn && (
        <JoinEventModal
          eventId={selectedEvent.id}
          hostName={selectedEvent.userId || 'Unknown User'}
          show={showJoinModal}
          onHide={() => setShowJoinModal(false)}
          onJoined={handleJoined}
        />
      )}

      <Toast
        message="Event link copied to clipboard!"
        show={showToast}
        onHide={() => setShowToast(false)}
        type="success"
      />

      {/* Share Modal */}
      <div className={`modal fade ${showShareModal ? 'show' : ''}`} style={{ display: showShareModal ? 'block' : 'none' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Share Event</h5>
              <button type="button" className="btn-close" onClick={() => setShowShareModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const eventUrl = `${window.location.origin}/event/${shareEventId}`;
                    navigator.clipboard.writeText(eventUrl);
                    setShowToast(true);
                    setShowShareModal(false);
                  }}
                >
                  <i className="bi bi-clipboard me-2"></i>
                  Copy Link
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/event/${shareEventId}`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    setShowShareModal(false);
                  }}
                >
                  <i className="bi bi-facebook me-2"></i>
                  Facebook
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/event/${shareEventId}`);
                    const text = encodeURIComponent(`Join me for a tennis event! 🎾`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                    setShowShareModal(false);
                  }}
                >
                  <i className="bi bi-twitter me-2"></i>
                  Twitter
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/event/${shareEventId}`);
                    const text = encodeURIComponent(`Join me for a tennis event! 🎾`);
                    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                    setShowShareModal(false);
                  }}
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}/event/${shareEventId}`);
                    const text = encodeURIComponent(`Join me for a tennis event! 🎾`);
                    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                    setShowShareModal(false);
                  }}
                >
                  <i className="bi bi-telegram me-2"></i>
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showShareModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default PublicEventList; 
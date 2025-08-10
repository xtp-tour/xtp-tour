import React, { useState, useEffect, useCallback } from 'react';
import { useAPI } from '../services/apiProvider';
import { ApiEvent } from '../types/api';
import { JoinEventModal } from './JoinEventModal';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation, getEventTitle } from './event/types';
import moment from 'moment';
import UserDisplay from './UserDisplay';
import Toast from './Toast';
import ShareEventModal from './ShareEventModal';
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

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.listPublicEvents();
      setEvents(response.events || []);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

        // Handle share functionality
        const handleShareEvent = (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          setShareEventId(event.id || '');
          setShowShareModal(true);
        };

        // Get share button
        const getShareButton = () => {
          return (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleShareEvent}
              title="Share event"
            >
              <i className="bi bi-share"></i>
            </button>
          );
        };

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

          // Check if user has already joined the event (only count explicitly accepted requests)
          const hasAlreadyJoined = event.joinRequests?.some(
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
            onClick: () => handleJoinEvent(event)
          };
        };

        // Simple user display for anonymous users
        const SimpleUserDisplay = ({ userId }: { userId: string }) => (
          <span className="text-muted">User {userId.slice(0, 8)}...</span>
        );

        return (
          <div key={event.id} className="mb-3">
            <BaseEventItem
              event={event}
              headerTitle={getEventTitle(event.eventType, event.expectedPlayers)}
              headerSubtitle={
                <span>
                  Host: {isSignedIn ? (
                    <UserDisplay userId={event.userId || ''} fallback="Unknown User" />
                  ) : (
                    <SimpleUserDisplay userId={event.userId || ''} />
                  )}
                </span>
              }
                colorClass="text-primary"
                timeSlots={timeSlots}
              timestamp={moment(event.createdAt)}
              actionButton={getActionButton()}
              shareButton={getShareButton()}
              defaultCollapsed={true}
            />
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

      <ShareEventModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        eventId={shareEventId}
        onShared={() => setShowToast(true)}
      />
    </div>
  );
};

export default PublicEventList;
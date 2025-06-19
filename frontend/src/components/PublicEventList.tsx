import React, { useState, useEffect } from 'react';
import { useAPI } from '../services/apiProvider';
import { ApiEvent } from '../types/api';
import { JoinEventModal } from './JoinEventModal';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import UserDisplay from './UserDisplay';
import Toast from './Toast';

interface Props {
  onEventJoined?: () => void;
}

const PublicEventList: React.FC<Props> = ({ onEventJoined }) => {
  const api = useAPI();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
        const getActionButton = () => ({
          variant: 'outline-primary',
          icon: 'bi-plus-circle',
          label: 'Join Event',
          onClick: () => handleJoinEvent(event)
        });

        return (
          <div key={event.id} className="position-relative">
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                // Don't navigate if clicking on the action button
                if ((e.target as HTMLElement).closest('.btn')) {
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
                defaultCollapsed={true}
              />
            </div>
            <div className="position-absolute top-0 end-0 p-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  const eventUrl = `${window.location.origin}/event/${event.id}`;
                  navigator.clipboard.writeText(eventUrl);
                  setShowToast(true);
                }}
                title="Share event"
              >
                <i className="bi bi-share"></i>
              </button>
            </div>
          </div>
        );
      })}

      {selectedEvent && selectedEvent.id && (
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
    </div>
  );
};

export default PublicEventList; 
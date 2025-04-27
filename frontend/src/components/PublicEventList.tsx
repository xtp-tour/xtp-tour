import React, { useEffect, useState } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { useAPI } from '../services/apiProvider';
import { components } from '../types/schema';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot } from './event/types';
import { JoinEventModal } from './JoinEventModal';
import moment from 'moment';

type Event = components['schemas']['ApiEvent'];

const transformEvent = (event: Event): Event => ({
  ...event,
  timeSlots: event.timeSlots.map(ts => ts),
  createdAt: event.createdAt || new Date().toISOString()
});

const PublicEventList: React.FC = () => {
  const api = useAPI();
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listPublicEvents();
      const availableEvents = response.events?.map(transformEvent) || [];
      setEvents(availableEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [api]);

  const handleJoin = (event: Event) => {
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const handleJoined = () => {
    setShowJoinModal(false);
    setSelectedEvent(null);
    // Refresh the list to show the updated state
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-muted text-center">No available events at the moment.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {events.map(event => {
        const timeSlots: TimeSlot[] = event.timeSlots.map(slot => ({
          date: moment(slot),
          isAvailable: true,
          isSelected: false
        }));

        const actionButton = isSignedIn ? {
          variant: 'outline-primary',
          icon: 'bi-plus-circle',
          label: 'Join',
          onClick: () => handleJoin(event)
        } : {
          variant: 'outline-primary',
          icon: 'bi-box-arrow-in-right',
          label: 'Sign in to respond',
          customButton: (
            <SignInButton mode="modal">
              <button className="btn btn-outline-primary" style={{ minWidth: '100px' }}>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Sign in to respond
              </button>
            </SignInButton>
          )
        };

        return (
          <BaseEventItem
            key={event.id}
            event={event}
            headerTitle={event.userId || 'Unknown User'}
            headerSubtitle="Looking for players"
            colorClass="text-primary"
            borderColorClass="border-primary"
            timeSlots={timeSlots}
            timestamp={moment(event.createdAt)}
            actionButton={actionButton}
          />
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
    </div>
  );
};

export default PublicEventList; 
import React, { useEffect, useState } from 'react';
import MyInvitationItem from './MyInvitationItem';
import AcceptedInvitationItem from './AcceptedInvitationItem';
import PublicInvitationList from './PublicInvitationList';
import { useAPI } from '../services/apiProvider';
import { components } from '../types/schema';

type Event = components['schemas']['ApiEvent'];

interface DisplayEvent extends Event {
  _displayTimeSlots: Array<{
    date: Date;
    time: string;
    isAvailable: boolean;
    isSelected: boolean;
  }>;
  _displayCreatedAt: Date;
}

const transformEventData = (event: Event): DisplayEvent => {
  // Convert string dates to Date objects for display purposes
  const transformedTimeSlots = event.timeSlots.map(ts => ({
    date: new Date(ts),
    time: ts,
    isAvailable: true,
    isSelected: event.confirmation ? 
      new Date(event.confirmation.datetime || '').getTime() === new Date(ts).getTime() : 
      false
  }));

  return {
    ...event,
    timeSlots: event.timeSlots, // Keep original timeSlots for API compatibility
    createdAt: event.createdAt, // Keep original createdAt for API compatibility
    _displayTimeSlots: transformedTimeSlots, // Add display-specific timeSlots
    _displayCreatedAt: new Date(event.createdAt || '') // Add display-specific createdAt
  };
};

interface SectionHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, isExpanded, onToggle }) => (
  <div 
    className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom cursor-pointer"
    onClick={onToggle}
    style={{ cursor: 'pointer', borderBottomColor: 'var(--tennis-light)' }}
  >
    <div className="d-flex align-items-center gap-2">
      <h2 className="h4 mb-0" style={{ color: 'var(--tennis-navy)' }}>{title}</h2>
      <span className="badge rounded-pill" style={{ 
        backgroundColor: 'var(--tennis-accent)',
        color: 'var(--tennis-navy)',
        minWidth: '24px'
      }}>{count}</span>
    </div>
    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} fs-4`} style={{ color: 'var(--tennis-navy)' }}></i>
  </div>
);

const InvitationList: React.FC = () => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<DisplayEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<DisplayEvent[]>([]);

  // State for section expansion
  const [expandedSections, setExpandedSections] = useState({
    myInvitations: true,
    acceptedInvitations: true,
    availableInvitations: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [myEventsResponse, availableEventsResponse] = await Promise.all([
          api.listEvents(),
          api.listPublicEvents()
        ]);

        setMyEvents((myEventsResponse.events || []).map(transformEventData));
        setAvailableEvents((availableEventsResponse.events || [])
          .map(transformEventData)
          .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [api]);

  // Filter events based on their status and ownership
  const myOpenEvents = myEvents
    .filter(event => event.status === 'OPEN')
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  
  const acceptedEvents = myEvents
    .filter(event => event.joinRequests && event.joinRequests.length > 0)
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

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

  return (
    <div className="mt-4">
      <section className="mb-5">
        <SectionHeader
          title="Your Events"
          count={myOpenEvents.length}
          isExpanded={expandedSections.myInvitations}
          onToggle={() => toggleSection('myInvitations')}
        />
        {expandedSections.myInvitations && (
          myOpenEvents.length === 0 ? (
            <p className="text-muted">You haven't created any events yet.</p>
          ) : (
            <div>
              {myOpenEvents.map(event => (
                <MyInvitationItem 
                  key={event.id} 
                  invitation={event} 
                  onDelete={async (id) => {
                    try {
                      await api.deleteEvent(id);
                      setMyEvents(prev => prev.filter(ev => ev.id !== id));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to delete event');
                    }
                  }} 
                />
              ))}
            </div>
          )
        )}
      </section>

      <section className="mb-5">
        <SectionHeader
          title="Accepted Events"
          count={acceptedEvents.length}
          isExpanded={expandedSections.acceptedInvitations}
          onToggle={() => toggleSection('acceptedInvitations')}
        />
        {expandedSections.acceptedInvitations && (
          acceptedEvents.length === 0 ? (
            <p className="text-muted">You haven't accepted any events yet.</p>
          ) : (
            <div>
              {acceptedEvents.map(event => (
                <AcceptedInvitationItem key={event.id} invitation={event} />
              ))}
            </div>
          )
        )}
      </section>

      <section className="mb-5">
        <SectionHeader
          title="Available Events to Join"
          count={availableEvents.length}
          isExpanded={expandedSections.availableInvitations}
          onToggle={() => toggleSection('availableInvitations')}
        />
        {expandedSections.availableInvitations && <PublicInvitationList />}
      </section>
    </div>
  );
};

export default InvitationList; 
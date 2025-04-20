import React, { useEffect, useState } from 'react';
import MyInvitationItem from './MyInvitationItem';
import AvailableInvitationItem from './AvailableInvitationItem';
import AcceptedInvitationItem from './AcceptedInvitationItem';
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
    date: new Date(ts.date || ''),
    time: ts.time || '',
    isAvailable: true,
    isSelected: event.confirmation ? 
      new Date(event.confirmation.datetime || '').getTime() === new Date(ts.date || '').getTime() : 
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
  const [events, setEvents] = useState<DisplayEvent[]>([]);

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
        
        const response = await api.listEvents();
        setEvents((response.events || []).map(transformEventData));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [api]);

  // Filter events based on their status and ownership
  const myEvents = events.filter(event => 
    event.status === 'OPEN'
  );
  
  const acceptedEvents = events.filter(event => 
    event.joinRequests && event.joinRequests.length > 0
  );
  
  const availableEvents = events.filter(event => 
    event.status === 'OPEN' &&
    (!event.joinRequests || event.joinRequests.length === 0)
  );

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
          count={myEvents.length}
          isExpanded={expandedSections.myInvitations}
          onToggle={() => toggleSection('myInvitations')}
        />
        {expandedSections.myInvitations && (
          myEvents.length === 0 ? (
            <p className="text-muted">You haven't created any events yet.</p>
          ) : (
            <div>
              {myEvents.map(event => (
                <MyInvitationItem 
                  key={event.id} 
                  invitation={event} 
                  onDelete={async (id) => {
                    try {
                      await api.deleteEvent(id);
                      setEvents(prev => prev.filter(ev => ev.id !== id));
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
        {expandedSections.availableInvitations && (
          availableEvents.length === 0 ? (
            <p className="text-muted">No available events at the moment.</p>
          ) : (
            <div>
              {availableEvents.map(event => (
                <AvailableInvitationItem 
                  key={event.id} 
                  invitation={event}
                  onAccept={() => {
                    // TODO: Implement event acceptance callback
                  }}
                />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default InvitationList; 
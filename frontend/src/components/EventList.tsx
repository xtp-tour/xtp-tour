import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import MyEventItem from './MyEventItem';
import JoinedEventItem from './JoinedEventItem';
import PublicEventList from './PublicEventList';
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

export interface EventListRef {
  refreshEvents: () => Promise<void>;
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

const EventList = forwardRef<EventListRef>((_, ref) => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<DisplayEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<DisplayEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<DisplayEvent[]>([]);

  // State for section expansion
  const [expandedSections, setExpandedSections] = useState({
    myEvents: true,
    joinedEvents: true,
    availableEvents: true
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState<'toJoin' | 'myEvents'>('toJoin');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [myEventsResponse, joinedEventsResponse, availableEventsResponse] = await Promise.all([
        api.listEvents(),
        api.listJoinedEvents(),
        api.listPublicEvents()
      ]);

      setMyEvents((myEventsResponse.events || []).map(transformEventData));
      setJoinedEvents((joinedEventsResponse.events || []).map(transformEventData));
      setAvailableEvents((availableEventsResponse.events || [])
        .map(transformEventData)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useImperativeHandle(ref, () => ({
    refreshEvents: fetchEvents
  }));

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events based on their status and ownership
  const myOpenEvents = myEvents
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
      {/* Tab Navigation */}
      <div className="mb-4">
        <ul className="nav nav-pills nav-fill" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link d-flex align-items-center justify-content-center flex-wrap gap-1 ${activeTab === 'toJoin' ? 'active' : ''}`}
              type="button"
              role="tab"
              onClick={() => setActiveTab('toJoin')}
              style={{
                backgroundColor: activeTab === 'toJoin' ? 'var(--tennis-accent)' : 'transparent',
                color: 'var(--tennis-navy)',
                border: '1px solid var(--tennis-accent)',
                fontWeight: activeTab === 'toJoin' ? '600' : '400',
                minHeight: '48px',
                fontSize: '0.9rem',
                padding: '8px 12px'
              }}
            >
              <div className="d-flex align-items-center flex-wrap justify-content-center gap-1">
                <i className="bi bi-search"></i>
                <span className="d-none d-sm-inline">Events to Join</span>
                <span className="d-inline d-sm-none">To Join</span>
                <span className="badge" style={{
                  backgroundColor: activeTab === 'toJoin' ? 'var(--tennis-navy)' : 'var(--tennis-accent)',
                  color: activeTab === 'toJoin' ? 'var(--tennis-accent)' : 'var(--tennis-navy)',
                  minWidth: '20px',
                  fontSize: '0.75rem'
                }}>
                  {availableEvents.length}
                </span>
              </div>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link d-flex align-items-center justify-content-center flex-wrap gap-1 ${activeTab === 'myEvents' ? 'active' : ''}`}
              type="button"
              role="tab"
              onClick={() => setActiveTab('myEvents')}
              style={{
                backgroundColor: activeTab === 'myEvents' ? 'var(--tennis-accent)' : 'transparent',
                color: 'var(--tennis-navy)',
                border: '1px solid var(--tennis-accent)',
                fontWeight: activeTab === 'myEvents' ? '600' : '400',
                minHeight: '48px',
                fontSize: '0.9rem',
                padding: '8px 12px'
              }}
            >
              <div className="d-flex align-items-center flex-wrap justify-content-center gap-1">
                <i className="bi bi-person-circle"></i>
                <span>My Events</span>
                <span className="badge" style={{
                  backgroundColor: activeTab === 'myEvents' ? 'var(--tennis-navy)' : 'var(--tennis-accent)',
                  color: activeTab === 'myEvents' ? 'var(--tennis-accent)' : 'var(--tennis-navy)',
                  minWidth: '20px',
                  fontSize: '0.75rem'
                }}>
                  {myOpenEvents.length + joinedEvents.length}
                </span>
              </div>
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Events to Join Tab */}
        {activeTab === 'toJoin' && (
          <div className="tab-pane fade show active">
            <section className="mb-5">
              <SectionHeader
                title="Available Events to Join"
                count={availableEvents.length}
                isExpanded={expandedSections.availableEvents}
                onToggle={() => toggleSection('availableEvents')}
              />
              {expandedSections.availableEvents && (
                <PublicEventList
                  onEventJoined={() => {
                    // Refresh joined events when a user joins an event
                    api.listJoinedEvents()
                      .then(response => {
                        setJoinedEvents((response.events || []).map(transformEventData));
                      })
                      .catch(err => {
                        console.error("Failed to refresh joined events:", err);
                      });
                  }}
                />
              )}
            </section>
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === 'myEvents' && (
          <div className="tab-pane fade show active">
            <section className="mb-5">
              <SectionHeader
                title="Your Events"
                count={myOpenEvents.length}
                isExpanded={expandedSections.myEvents}
                onToggle={() => toggleSection('myEvents')}
              />
              {expandedSections.myEvents && (
                myOpenEvents.length === 0 ? (
                  <p className="text-muted">You haven't created any events yet.</p>
                ) : (
                  <div>
                    {myOpenEvents.map(event => (
                      <MyEventItem
                        key={event.id}
                        event={event}
                        onDelete={async (id) => {
                          try {
                            await api.deleteEvent(id);
                            setMyEvents(prev => prev.filter(ev => ev.id !== id));
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to delete event');
                          }
                        }}
                        onEventUpdated={() => {
                          // Refresh all event lists when an event is confirmed
                          api.listEvents()
                            .then(response => {
                              setMyEvents((response.events || []).map(transformEventData));
                            })
                            .catch(err => {
                              console.error("Failed to refresh events:", err);
                            });
                        }}
                      />
                    ))}
                  </div>
                )
              )}
            </section>

            <section className="mb-5">
              <SectionHeader
                title="Joined Events"
                count={joinedEvents.length}
                isExpanded={expandedSections.joinedEvents}
                onToggle={() => toggleSection('joinedEvents')}
              />
              {expandedSections.joinedEvents && (
                joinedEvents.length === 0 ? (
                  <p className="text-muted">You haven't joined any events yet.</p>
                ) : (
                  <div>
                    {joinedEvents.map(event => (
                      <JoinedEventItem
                        key={event.id}
                        event={event}
                        onCancelled={() => {
                          // Refresh joined events after cancellation
                          api.listJoinedEvents()
                            .then(response => {
                              setJoinedEvents((response.events || []).map(transformEventData));
                            })
                            .catch(err => {
                              console.error("Failed to refresh joined events:", err);
                            });
                        }}
                      />
                    ))}
                  </div>
                )
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
});

export default EventList;
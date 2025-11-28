import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
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

const EventList = forwardRef<EventListRef>((_, ref) => {
  const { t } = useTranslation();
  const api = useAPI();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<DisplayEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<DisplayEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<DisplayEvent[]>([]);

  // State for active tab
  const [activeTab, setActiveTab] = useState<'toJoin' | 'myEvents' | 'joinedEvents'>('toJoin');

  // State for layout (list or grid) - only applies on desktop
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  const filterJoinableEvents = useCallback((events: DisplayEvent[]) => {
    if (!user?.id) {
      return events;
    }

    return events.filter(event =>
      !(event.joinRequests?.some(req => req.userId === user.id && req.isRejected !== true))
    );
  }, [user?.id]);

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
      setAvailableEvents(filterJoinableEvents((availableEventsResponse.events || [])
        .map(transformEventData)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [api, filterJoinableEvents]);

  useImperativeHandle(ref, () => ({
    refreshEvents: fetchEvents
  }));

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events based on their status and ownership
  const myOpenEvents = myEvents
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  const joinedEventsSorted = joinedEvents
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  if (loading) {
    return (
      <div className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('eventList.loading')}</span>
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="flex-grow-1">
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
                <span className="d-none d-sm-inline">{t('eventList.tabs.toJoin')}</span>
                <span className="d-inline d-sm-none">{t('eventList.tabs.toJoinShort')}</span>
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
                <span>{t('eventList.tabs.myEvents')}</span>
                <span className="badge" style={{
                  backgroundColor: activeTab === 'myEvents' ? 'var(--tennis-navy)' : 'var(--tennis-accent)',
                  color: activeTab === 'myEvents' ? 'var(--tennis-accent)' : 'var(--tennis-navy)',
                  minWidth: '20px',
                  fontSize: '0.75rem'
                }}>
                  {myOpenEvents.length}
                </span>
              </div>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link d-flex align-items-center justify-content-center flex-wrap gap-1 ${activeTab === 'joinedEvents' ? 'active' : ''}`}
              type="button"
              role="tab"
              onClick={() => setActiveTab('joinedEvents')}
              style={{
                backgroundColor: activeTab === 'joinedEvents' ? 'var(--tennis-accent)' : 'transparent',
                color: 'var(--tennis-navy)',
                border: '1px solid var(--tennis-accent)',
                fontWeight: activeTab === 'joinedEvents' ? '600' : '400',
                minHeight: '48px',
                fontSize: '0.9rem',
                padding: '8px 12px'
              }}
            >
              <div className="d-flex align-items-center flex-wrap justify-content-center gap-1">
                <i className="bi bi-people"></i>
                <span>{t('eventList.tabs.joinedEvents')}</span>
                <span className="badge" style={{
                  backgroundColor: activeTab === 'joinedEvents' ? 'var(--tennis-navy)' : 'var(--tennis-accent)',
                  color: activeTab === 'joinedEvents' ? 'var(--tennis-accent)' : 'var(--tennis-navy)',
                  minWidth: '20px',
                  fontSize: '0.75rem'
                }}>
                  {joinedEventsSorted.length}
                </span>
              </div>
            </button>
          </li>
        </ul>
          </div>
          {/* Layout Toggle - Only visible on desktop */}
          <div className="d-none d-md-flex ms-3 align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm ${layout === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setLayout('list')}
              aria-label="List view"
              title="List view"
            >
              <i className="bi bi-list-ul"></i>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${layout === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <i className="bi bi-grid-3x2-gap"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Events to Join Tab */}
        {activeTab === 'toJoin' && (
          <div className="tab-pane fade show active">
            <PublicEventList
              layout={layout}
              onEventJoined={() => {
                // Refresh joined and available events when a user joins an event
                Promise.all([api.listJoinedEvents(), api.listPublicEvents()])
                  .then(([joinedResponse, availableResponse]) => {
                    setJoinedEvents((joinedResponse.events || []).map(transformEventData));
                    setAvailableEvents(filterJoinableEvents((availableResponse.events || [])
                      .map(transformEventData)
                      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())));
                  })
                  .catch(err => {
                    console.error("Failed to refresh events:", err);
                  });
              }}
            />
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === 'myEvents' && (
          <div className="tab-pane fade show active">
            {myOpenEvents.length === 0 ? (
              <p className="text-muted">{t('eventList.empty.noEventsCreated')}</p>
            ) : (
              <>
                {/* Mobile: Always list view */}
                <div className="d-md-none">
                  {myOpenEvents.map(event => (
                    <div key={event.id} className="mb-3">
                      <MyEventItem
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
                    </div>
                  ))}
                </div>
                {/* Desktop: Grid or list based on toggle */}
                <div className={layout === 'grid' ? 'row g-3 d-none d-md-flex' : 'd-none d-md-block'}>
                  {myOpenEvents.map(event => (
                    <div key={event.id} className={layout === 'grid' ? 'col-md-6' : 'mb-3'}>
                      <MyEventItem
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
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Joined Events Tab */}
        {activeTab === 'joinedEvents' && (
          <div className="tab-pane fade show active">
            {joinedEventsSorted.length === 0 ? (
              <p className="text-muted">{t('eventList.empty.noEventsJoined')}</p>
            ) : (
              <>
                {/* Mobile: Always list view */}
                <div className="d-md-none">
                  {joinedEventsSorted.map(event => (
                    <div key={event.id} className="mb-3">
                      <JoinedEventItem
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
                    </div>
                  ))}
                </div>
                {/* Desktop: Grid or list based on toggle */}
                <div className={layout === 'grid' ? 'row g-3 d-none d-md-flex' : 'd-none d-md-block'}>
                  {joinedEventsSorted.map(event => (
                    <div key={event.id} className={layout === 'grid' ? 'col-md-6' : 'mb-3'}>
                      <JoinedEventItem
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
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default EventList;
import React, { useState, useEffect, useCallback } from 'react';
import { useAPI } from '../services/apiProvider';
import { ApiEvent } from '../types/api';
import { JoinEventModal } from './JoinEventModal';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation, getEventTitle } from './event/types';
import Toast from './Toast';
import ShareEventModal from './ShareEventModal';
import { useUser, useClerk } from '@clerk/clerk-react';
import ShareButton from './ShareButton';
import HostDisplay from './HostDisplay';
import { useTranslation } from 'react-i18next';
import { getDebugAuthToken } from '../auth/debugAuth';

interface Props {
  onEventJoined?: () => void;
  layout?: 'list' | 'grid';
}

const isClerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const PublicEventListClerk: React.FC<Props> = ({ onEventJoined, layout = 'list' }) => {
  const { t } = useTranslation();
  const api = useAPI();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
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
      setError(t('common.loading')); // Reusing common error message
    } finally {
      setLoading(false);
    }
  }, [api, t]);

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

  const renderEvent = (event: ApiEvent) => {
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
      return <ShareButton onClick={handleShareEvent} />;
    };

    // Get action button for joining
    const getActionButton = () => {
      if (!isSignedIn) {
        return {
          variant: 'outline-secondary',
          icon: 'bi-person-plus',
          label: t('eventActions.signInToJoin'),
          onClick: () => {
            openSignIn();
          }
        };
      }

      // Check if user is the event owner
      const isOwner = user?.id === event.userId;

      // Check if event is open for joining
      const isEventOpen = event.status === 'OPEN';

      // Check if user has already joined the event (pending or accepted requests - not rejected)
      const hasAlreadyJoined = event.joinRequests?.some(
        req => req.userId === user?.id && req.isRejected !== true
      );

      // Show "Already Joined" indicator if user has joined
      if (hasAlreadyJoined) {
        return {
          variant: 'outline-success',
          icon: 'bi-check-circle-fill',
          label: t('eventActions.alreadyJoined'),
          onClick: () => {},
          disabled: true
        };
      }

      // Hide button if user owns the event or event is not open
      if (isOwner || !isEventOpen) {
        return {
          variant: 'outline-primary',
          icon: 'bi-plus-circle',
          label: t('eventActions.join'),
          onClick: () => {},
          hidden: true
        };
      }

      return {
        variant: 'outline-primary',
        icon: 'bi-plus-circle',
        label: t('eventActions.join'),
        onClick: () => handleJoinEvent(event)
      };
    };

    return (
      <BaseEventItem
        event={event}
        headerTitle={getEventTitle(event.eventType, event.expectedPlayers, t)}
        headerSubtitle={
          <HostDisplay
            userId={event.userId || ''}
            fallback={t('host.unknownUser')}
            showAsPlainText={!isSignedIn}
          />
        }
        colorClass="text-primary"
        timeSlots={timeSlots}
        actionButton={getActionButton()}
        shareButton={getShareButton()}
        defaultCollapsed={true}
      />
    );
  };

  return (
    <div>
      {/* Mobile: Always list view */}
      <div className="d-md-none">
        {events.map(event => (
          <div key={event.id} className="mb-3">
            {renderEvent(event)}
          </div>
        ))}
      </div>
      {/* Desktop: Grid or list based on toggle */}
      <div className={layout === 'grid' ? 'row g-3 d-none d-md-flex' : 'd-none d-md-block'}>
        {events.map(event => (
          <div key={event.id} className={layout === 'grid' ? 'col-md-6' : 'mb-3'}>
            {renderEvent(event)}
          </div>
        ))}
      </div>

      {selectedEvent && selectedEvent.id && isSignedIn && (
        <JoinEventModal
          eventId={selectedEvent.id}
          userId={selectedEvent.userId || ''}
          show={showJoinModal}
          onHide={() => setShowJoinModal(false)}
          onJoined={handleJoined}
        />
      )}

      <Toast
        message={t('share.eventLinkCopied')}
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

const PublicEventListNoClerk: React.FC<Props> = ({ onEventJoined, layout = 'list' }) => {
  const { t } = useTranslation();
  const api = useAPI();
  const debugToken = getDebugAuthToken();
  const isSignedIn = !!debugToken;
  const userId = debugToken;

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
      setError(t('common.loading'));
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleJoinEvent = (event: ApiEvent) => {
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const handleJoined = () => {
    setShowJoinModal(false);
    loadEvents();
    onEventJoined?.();
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

  const renderEvent = (event: ApiEvent) => {
    const timeSlots: TimeSlot[] = event.timeSlots.map(slot =>
      timeSlotFromDateAndConfirmation(slot, event.confirmation, true)
    );

    const handleShareEvent = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setShareEventId(event.id || '');
      setShowShareModal(true);
    };

    const getShareButton = () => {
      return <ShareButton onClick={handleShareEvent} />;
    };

    const getActionButton = () => {
      if (!isSignedIn) {
        return {
          variant: 'outline-secondary',
          icon: 'bi-person-plus',
          label: t('eventActions.signInToJoin'),
          onClick: () => {},
          disabled: true
        };
      }

      const isOwner = userId === event.userId;
      const isEventOpen = event.status === 'OPEN';
      const hasAlreadyJoined = event.joinRequests?.some(
        req => req.userId === userId && req.isRejected !== true
      );

      if (hasAlreadyJoined) {
        return {
          variant: 'outline-success',
          icon: 'bi-check-circle-fill',
          label: t('eventActions.alreadyJoined'),
          onClick: () => {},
          disabled: true
        };
      }

      if (isOwner || !isEventOpen) {
        return {
          variant: 'outline-primary',
          icon: 'bi-plus-circle',
          label: t('eventActions.join'),
          onClick: () => {},
          hidden: true
        };
      }

      return {
        variant: 'outline-primary',
        icon: 'bi-plus-circle',
        label: t('eventActions.join'),
        onClick: () => handleJoinEvent(event)
      };
    };

    return (
      <BaseEventItem
        event={event}
        headerTitle={getEventTitle(event.eventType, event.expectedPlayers, t)}
        headerSubtitle={
          <HostDisplay
            userId={event.userId || ''}
            fallback={t('host.unknownUser')}
            showAsPlainText={!isSignedIn}
          />
        }
        colorClass="text-primary"
        timeSlots={timeSlots}
        actionButton={getActionButton()}
        shareButton={getShareButton()}
        defaultCollapsed={true}
      />
    );
  };

  return (
    <div>
      <div className="d-md-none">
        {events.map(event => (
          <div key={event.id} className="mb-3">
            {renderEvent(event)}
          </div>
        ))}
      </div>
      <div className={layout === 'grid' ? 'row g-3 d-none d-md-flex' : 'd-none d-md-block'}>
        {events.map(event => (
          <div key={event.id} className={layout === 'grid' ? 'col-md-6' : 'mb-3'}>
            {renderEvent(event)}
          </div>
        ))}
      </div>

      {selectedEvent && selectedEvent.id && isSignedIn && (
        <JoinEventModal
          eventId={selectedEvent.id}
          userId={selectedEvent.userId || ''}
          show={showJoinModal}
          onHide={() => setShowJoinModal(false)}
          onJoined={handleJoined}
        />
      )}

      <Toast
        message={t('share.eventLinkCopied')}
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

const PublicEventList: React.FC<Props> = (props) => {
  return isClerkAvailable ? <PublicEventListClerk {...props} /> : <PublicEventListNoClerk {...props} />;
};

export default PublicEventList;
import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';
import { components } from '../../types/schema';
import { formatDuration } from '../../utils/dateUtils';
import { formatTimeSlotLocalized } from '../../utils/i18nDateUtils';
import { LocationBadge } from './EventBadges';
import { BADGE_STYLES, NESTED_BADGE_STYLES } from '../../styles/badgeStyles';
import { useTranslation } from 'react-i18next';

type ApiEvent = components['schemas']['ApiEvent'];

interface EventHeaderProps extends StyleProps {
  title: string;
  subtitle?: string | React.ReactNode;
  actionButton: ActionButton;
  timeSlotSummary?: string;
  joinedCount?: number;
  event: ApiEvent;
  shareButton?: React.ReactNode;
}

const formatConfirmedDateTime = (datetime: string): string => {
  return formatTimeSlotLocalized(datetime);
};

// Get status badge info based on event status
const getStatusBadge = (event: ApiEvent, t: (key: string) => string) => {
  switch (event.status) {
    case 'OPEN':
      return { text: t('eventStatus.open'), variant: 'text-bg-primary' };
    case 'ACCEPTED':
      return { text: t('eventStatus.accepted'), variant: 'text-bg-warning' };
    case 'CONFIRMED':
      return { text: t('eventStatus.confirmed'), variant: 'text-bg-success' };
    case 'RESERVATION_FAILED':
      return { text: t('eventStatus.reservationFailed'), variant: 'text-bg-danger' };
    case 'CANCELLED':
      return { text: t('eventStatus.cancelled'), variant: 'text-bg-secondary' };
    case 'COMPLETED':
      return { text: t('eventStatus.completed'), variant: 'text-bg-secondary' };
    default:
      return { text: event.status, variant: 'text-bg-secondary' };
  }
};



const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  subtitle,
  colorClass = 'text-primary',
  actionButton,
  timeSlotSummary,
  joinedCount,
  event,
  shareButton,
}) => {
  const { t } = useTranslation();
  // Check if the event is confirmed
  const isConfirmed = event.status === 'CONFIRMED';
  const statusBadge = getStatusBadge(event, t);
  
  return (
    <div className="p-4">
      {/* Main Header Row */}
      <div className="d-flex align-items-start justify-content-between mb-3">
        {/* Left: Event Title and Status */}
        <div className="flex-grow-1 me-3">
          <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
            <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '1.25rem', lineHeight: '1.3' }}>
              {title}
            </h5>
            <span className={`badge ${statusBadge.variant} px-3 py-2`} 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
              {statusBadge.text}
            </span>
            {typeof joinedCount === 'number' && (
              <span className="badge bg-light text-dark px-3 py-2" 
                    style={{ 
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '20px',
                      border: '1px solid #dee2e6'
                    }}
                    title={`${joinedCount} ${joinedCount === 1 ? 'ack' : 'acks'}`}>
                <i className="bi bi-people me-1" style={{ fontSize: '0.875rem' }}></i>
                {joinedCount} {joinedCount === 1 ? 'ack' : 'acks'}
              </span>
            )}
          </div>
          
          {/* Host Information */}
          {subtitle && (
            <div className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-person-circle me-2" style={{ fontSize: '1rem' }}></i>
              {subtitle}
            </div>
          )}
        </div>
        
        {/* Right: Share Button */}
        <div className="flex-shrink-0">
          {shareButton}
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="row g-3 mb-3">
        {/* Date & Time */}
        <div className="col-12 col-md-6">
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-circle p-2 me-3" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-calendar-event text-primary d-flex align-items-center justify-content-center" 
                 style={{ fontSize: '1.1rem' }}></i>
            </div>
            <div>
              <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                {isConfirmed && event.confirmation ? (
                  <>
                    <i className="bi bi-calendar-check me-1 text-success"></i>
                    {formatConfirmedDateTime(event.confirmation.datetime || '')}
                  </>
                ) : (
                  timeSlotSummary
                )}
              </div>
              <div className="text-muted small">
                <i className="bi bi-stopwatch me-1"></i>
                {formatDuration(event.sessionDuration)}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="col-12 col-md-6">
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-circle p-2 me-3" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-geo-alt text-primary d-flex align-items-center justify-content-center" 
                 style={{ fontSize: '1.1rem' }}></i>
            </div>
            <div className="flex-grow-1">
              {isConfirmed && event.confirmation?.location ? (
                <LocationBadge location={event.confirmation.location} />
              ) : (
                event.locations && event.locations.length > 0 && (
                  <div className="d-flex flex-wrap gap-1">
                    {event.locations.slice(0, 2).map((location, index) => (
                      <LocationBadge key={`location-${index}`} location={location} />
                    ))}
                    {event.locations.length > 2 && (
                      <span className="badge bg-light text-muted" style={{ fontSize: '0.75rem' }}>
                        +{event.locations.length - 2} more
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Level */}
      <div className="mb-3">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`skill-level-tooltip-header-${event.skillLevel}`}>
            {t(`createEvent.skillHints.${event.skillLevel}`)}
          </Tooltip>}
        >
          <span className="badge bg-dark text-white px-3 py-2" 
                style={{ 
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  cursor: 'help'
                }}>
            <i className="bi bi-trophy me-2"></i>
            {event.skillLevel}
            <span className="badge bg-light text-dark ms-2" 
                  style={{ 
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '8px'
                  }}>
              {t(`createEvent.skillLabels.${event.skillLevel}`)}
            </span>
          </span>
        </OverlayTrigger>
      </div>
      
      {/* Action Button */}
      <div className="mt-4">
        {actionButton.customButton || (!actionButton.hidden && (
          <Button
            variant={actionButton.variant}
            onClick={actionButton.onClick}
            className="w-100 d-flex justify-content-center align-items-center"
            style={{ 
              minHeight: '48px', 
              fontSize: '0.95rem',
              fontWeight: '600',
              borderRadius: '12px',
              textTransform: 'none'
            }}
            disabled={actionButton.disabled}
          >
            <i className={`bi ${actionButton.icon} me-2`} style={{ fontSize: '1.1rem' }}></i>
            {actionButton.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EventHeader; 
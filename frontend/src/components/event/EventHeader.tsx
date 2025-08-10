import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';
import moment from 'moment';
import { useMediaQuery } from 'react-responsive';
import { components } from '../../types/schema';
import { SKILL_LEVEL_DESCRIPTIONS } from './types';
import { formatDuration } from '../../utils/dateUtils';
import { LocationBadge } from './EventBadges';

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
  return moment(datetime).format('ddd, MMM D @ h:mm A');
};

const truncateUsername = (name: string) =>
  name.length > 20 ? name.slice(0, 20) + '...' : name;

// Get status badge info based on event status
const getStatusBadge = (event: ApiEvent) => {
  switch (event.status) {
    case 'OPEN':
      return { text: 'Open', variant: 'text-bg-primary' };
    case 'ACCEPTED':
      return { text: 'Awaiting confirmation', variant: 'text-bg-warning' };
    case 'CONFIRMED':
      return { text: 'Confirmed', variant: 'text-bg-success' };
    case 'RESERVATION_FAILED':
      return { text: 'Reservation failed', variant: 'text-bg-danger' };
    case 'CANCELLED':
      return { text: 'Cancelled', variant: 'text-bg-secondary' };
    case 'COMPLETED':
      return { text: 'Completed', variant: 'text-bg-secondary' };
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
  const isMobile = useMediaQuery({ maxWidth: 575 });
  
  // Check if the event is confirmed
  const isConfirmed = event.status === 'CONFIRMED';
  const statusBadge = getStatusBadge(event);
  
  return (
    <div className="card-header bg-white p-2">
      <div className="d-flex align-items-center justify-content-between gap-2 w-100">
        {/* Left: Avatar and info */}
        <div className="d-flex align-items-center flex-grow-1 min-width-0 gap-2">
          <div className="me-2 flex-shrink-0">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              <i className={`bi bi-person-circle ${colorClass} fs-4`}></i>
            </div>
          </div>
          <div className="d-flex flex-column min-width-0">
            <div className="d-flex align-items-center gap-2 min-width-0 flex-grow-1" style={{ minWidth: 0 }}>
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip id={`username-tooltip-${title}`}>{title}</Tooltip>}
              >
                <h6
                  className="mb-0 text-truncate d-flex align-items-center"
                  style={{
                    minWidth: 0,
                    maxWidth: '100%',
                    flexGrow: 1,
                    flexShrink: 1,
                    display: 'block',
                    verticalAlign: 'bottom',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={title}
                >
                  {isMobile ? truncateUsername(title) : title}
                  <span className={`badge ${statusBadge.variant} ms-2`} style={{ fontSize: '0.7em' }}>
                    {statusBadge.text}
                  </span>
                  {typeof joinedCount === 'number' && (
                    <span className="badge bg-secondary ms-2" style={{ fontSize: '0.8em' }} 
                          title={`${joinedCount} ${joinedCount === 1 ? 'ack' : 'acks'}`}
                          aria-label={`${joinedCount} ${joinedCount === 1 ? 'ack' : 'acks'}`}>
                      <i className="bi bi-people me-1"></i>{joinedCount} {joinedCount === 1 ? 'ack' : 'acks'}
                    </span>
                  )}
                </h6>
              </OverlayTrigger>
            </div>
            {subtitle && <small className={colorClass}>{subtitle}</small>}
            {isConfirmed && event.confirmation && (
              <div className="mt-1">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <small className="text-muted text-wrap">
                    <div className="d-flex flex-wrap">
                      <div className="me-2">
                        <i className="bi bi-calendar-check me-1"></i>
                        {formatConfirmedDateTime(event.confirmation.datetime || '')}
                      </div>
                      {event.confirmation.location && (
                        <div>
                          <LocationBadge location={event.confirmation.location} />
                        </div>
                      )}
                    </div>
                  </small>
                  <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-navy)' }}>
                    <i className="bi bi-stopwatch me-1"></i>
                    {formatDuration(event.sessionDuration)}
                  </span>
                </div>
              </div>
            )}
            {/* Always show time slots in header regardless of collapsed state */}
            {timeSlotSummary && !isConfirmed && (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <small className="text-muted text-wrap">
                  <i className="bi bi-calendar-event me-1"></i>
                  {timeSlotSummary}
                </small>
                <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-navy)' }}>
                  <i className="bi bi-stopwatch me-1"></i>
                  {formatDuration(event.sessionDuration)}
                </span>
              </div>
            )}
            {/* Location badges right after date/time - only for non-confirmed events */}
            {!isConfirmed && event.locations && event.locations.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mt-1">
                {event.locations.map((location, index) => (
                  <LocationBadge 
                    key={`location-${index}`} 
                    location={location} 
                  />
                ))}
              </div>
            )}
            {/* Skill level badge */}
            <div className="d-flex flex-wrap gap-1 mt-1">
              <span className="badge text-bg-dark d-inline-flex align-items-center gap-1" style={{ 
                height: '24px', 
                padding: '0.25rem 0.5rem', 
                fontSize: '0.75rem'
              }}>
                <span>{event.skillLevel}</span>
                <span className="badge bg-light text-dark" style={{ fontSize: '0.65em' }}>
                  {SKILL_LEVEL_DESCRIPTIONS[event.skillLevel]}
                </span>
              </span>
            </div>
          </div>
        </div>
        {/* Right: Compact action bar (desktop only) */}
        <div className="d-none d-sm-flex align-items-center gap-1 flex-shrink-0">
          {shareButton}
          {actionButton.customButton || (!actionButton.hidden && (
            <Button
              variant={actionButton.variant}
              onClick={actionButton.onClick}
              className="text-nowrap btn-sm"
              style={{ minHeight: '32px', fontSize: '0.8rem' }}
              disabled={actionButton.disabled}
              title={actionButton.label}
            >
              <i className={`bi ${actionButton.icon} me-1`}></i>
              {actionButton.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Mobile action bar */}
      <div className="d-sm-none">
        <div className="d-flex justify-content-between align-items-center gap-2 mt-2">
          {/* Action button for mobile - compact */}
          <div className="flex-grow-1">
            {actionButton.customButton || (!actionButton.hidden && (
              <Button
                variant={actionButton.variant}
                onClick={actionButton.onClick}
                className="w-100 d-flex justify-content-center align-items-center btn-sm"
                style={{ minHeight: '36px', fontSize: '0.85rem' }}
                disabled={actionButton.disabled}
              >
                <i className={`bi ${actionButton.icon} me-1`}></i>
                {actionButton.label}
              </Button>
            ))}
          </div>
          {/* Share button for mobile */}
          {shareButton}
        </div>
      </div>
    </div>
  );
};

export default EventHeader; 
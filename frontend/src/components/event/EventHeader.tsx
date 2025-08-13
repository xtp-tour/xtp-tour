import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';
import moment from 'moment';
import { components } from '../../types/schema';
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_HINTS } from './types';
import { formatDuration } from '../../utils/dateUtils';
import { LocationBadge } from './EventBadges';
import { BADGE_STYLES, NESTED_BADGE_STYLES } from '../../styles/badgeStyles';

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
  // Check if the event is confirmed
  const isConfirmed = event.status === 'CONFIRMED';
  const statusBadge = getStatusBadge(event);
  
  return (
    <div className="card-header bg-white p-2">
      <div className="d-flex align-items-center justify-content-between gap-2 w-100">
        {/* Left: Event info */}
        <div className="d-flex align-items-center flex-grow-1 min-width-0 gap-2">
          <div className="d-flex flex-column min-width-0 flex-grow-1">
            <div className="d-flex align-items-center justify-content-between gap-2 min-width-0 flex-grow-1 w-100" style={{ minWidth: 0 }}>
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
                    {title}
                    <span className={`badge ${statusBadge.variant} ms-2`} style={BADGE_STYLES}>
                      {statusBadge.text}
                    </span>
                    {typeof joinedCount === 'number' && (
                      <span className="badge text-bg-secondary ms-2" style={BADGE_STYLES} 
                            title={`${joinedCount} ${joinedCount === 1 ? 'ack' : 'acks'}`}
                            aria-label={`${joinedCount} ${joinedCount === 1 ? 'ack' : 'acks'}`}>
                        <i className="bi bi-people me-1"></i>{joinedCount} {joinedCount === 1 ? 'ack' : 'acks'}
                      </span>
                    )}
                  </h6>
                </OverlayTrigger>
              </div>
              {/* Share button positioned at title level (all screen sizes) */}
              <div className="d-flex align-items-center flex-shrink-0">
                {shareButton}
              </div>
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
                  <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-navy)' }}>
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
                <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-navy)' }}>
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
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`skill-level-tooltip-header-${event.skillLevel}`}>{SKILL_LEVEL_HINTS[event.skillLevel]}</Tooltip>}
              >
                <span className="badge text-bg-dark" style={BADGE_STYLES}>
                  <span>{event.skillLevel}</span>
                  <span className="badge bg-light text-dark" style={NESTED_BADGE_STYLES}>
                    {SKILL_LEVEL_LABELS[event.skillLevel]}
                  </span>
                </span>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop action bar - full width below header */}
      <div className="d-none d-sm-block">
        <div className="mt-2">
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
      </div>
      
      {/* Mobile action bar */}
      <div className="d-sm-none">
        <div className="mt-2">
          {/* Action button for mobile - full width */}
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
      </div>
    </div>
  );
};

export default EventHeader; 
import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';
import moment from 'moment';
import TimeAgo from 'react-timeago';
import { useMediaQuery } from 'react-responsive';
import { components } from '../../types/schema';
import { SKILL_LEVEL_DESCRIPTIONS, getEventTypeLabel, getRequestTypeLabel } from './types';

type ApiEvent = components['schemas']['ApiEvent'];

interface EventHeaderProps extends StyleProps {
  title: string;
  subtitle?: string | React.ReactNode;
  timestamp: moment.Moment;
  actionButton: ActionButton;
  isCollapsed?: boolean;
  timeSlotSummary?: string;
  onToggleCollapse?: () => void;
  joinedCount?: number;
  event: ApiEvent;
}

const formatFullTimestamp = (timestamp: moment.Moment): string => {
  return timestamp.format('MMMM D, YYYY [at] h:mm A');
};

const truncateUsername = (name: string) =>
  name.length > 30 ? name.slice(0, 30) + '...' : name;

const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  subtitle,
  colorClass = 'text-primary',
  timestamp,
  actionButton,
  isCollapsed = false,
  timeSlotSummary,
  onToggleCollapse,
  joinedCount,
  event,
}) => {
  // Ensure we have a valid Moment object
  const momentTimestamp = moment.isMoment(timestamp) ? timestamp : moment(timestamp);
  const isMobile = useMediaQuery({ maxWidth: 575 });
  
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
                  {typeof joinedCount === 'number' && (
                    <span className="badge bg-secondary ms-2" style={{ fontSize: '0.8em' }} title="Players joined">
                      <i className="bi bi-people me-1"></i>{joinedCount}
                    </span>
                  )}
                </h6>
              </OverlayTrigger>
              {!isCollapsed && (
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id={`timestamp-tooltip-${momentTimestamp.valueOf()}`}>
                      {formatFullTimestamp(momentTimestamp)}
                    </Tooltip>
                  }
                >
                  <small className="text-muted">
                    <i className="bi bi-clock-history me-1"></i>
                    <TimeAgo date={momentTimestamp.toDate()} />
                  </small>
                </OverlayTrigger>
              )}
            </div>
            {subtitle && <small className={colorClass}>{subtitle}</small>}
            <div className="d-flex flex-wrap gap-2 mt-1">
              <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
                {getEventTypeLabel(event.eventType)}
              </span>
              <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-light)', color: 'var(--tennis-navy)', border: '1px solid var(--tennis-navy)' }}>
                {getRequestTypeLabel(event.expectedPlayers)}
              </span>
              <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: 'var(--tennis-blue)' }}>
                <span>{event.skillLevel}</span>
                <span className="badge bg-light" style={{ fontSize: '0.75em', color: 'var(--tennis-blue)' }}>
                  {SKILL_LEVEL_DESCRIPTIONS[event.skillLevel]}
                </span>
              </span>
              <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-navy)' }}>
                <i className="bi bi-stopwatch me-1"></i>
                {event.sessionDuration} {event.sessionDuration === 1 ? 'hour' : 'hours'}
              </span>
            </div>
            {timeSlotSummary && (
              <small className="text-muted text-wrap">
                <i className="bi bi-calendar-event me-1"></i>
                {timeSlotSummary}
              </small>
            )}
          </div>
        </div>
        {/* Right: Chevron and action button (desktop only) */}
        <div className="d-none d-sm-flex align-items-center gap-2 flex-shrink-0">
          {actionButton.customButton || (
            <Button
              variant={actionButton.variant}
              onClick={actionButton.onClick}
              className="text-nowrap btn-sm"
              style={{ minWidth: 90, maxWidth: 180 }}
              disabled={actionButton.disabled}
            >
              <i className={`bi ${actionButton.icon} me-1`}></i>
              {actionButton.label}
            </Button>
          )}
          <button
            type="button"
            className={`btn btn-link p-0 border-0 shadow-none d-flex align-items-center ${colorClass}`}
            style={{ fontSize: 24 }}
            aria-label={isCollapsed ? 'Expand event' : 'Collapse event'}
            onClick={onToggleCollapse}
          >
            <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
          </button>
        </div>
        {/* Chevron only for mobile */}
        <div className="d-flex d-sm-none align-items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className={`btn btn-link p-0 border-0 shadow-none d-flex align-items-center ${colorClass}`}
            style={{ fontSize: 24 }}
            aria-label={isCollapsed ? 'Expand event' : 'Collapse event'}
            onClick={onToggleCollapse}
          >
            <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
          </button>
        </div>
      </div>
      {/* Action button for mobile only, full width */}
      <div className="d-flex d-sm-none mt-2">
        {actionButton.customButton || (
          <Button
            variant={actionButton.variant}
            onClick={actionButton.onClick}
            className="w-100 btn-sm"
            style={{ minWidth: 90 }}
            disabled={actionButton.disabled}
          >
            <i className={`bi ${actionButton.icon} me-1`}></i>
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventHeader; 
import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';
import moment from 'moment';
import { useMediaQuery } from 'react-responsive';
import { components } from '../../types/schema';
import { SKILL_LEVEL_DESCRIPTIONS, getEventTypeLabel, getRequestTypeLabel } from './types';
import '../EventFlowDiagram.css'; // Import CSS with button styles

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

const formatConfirmedDateTime = (datetime: string): string => {
  return moment(datetime).format('ddd, MMM D @ h:mm A');
};

const truncateUsername = (name: string) =>
  name.length > 20 ? name.slice(0, 20) + '...' : name;

// Add CSS for the consistent button styling
const buttonStyle = {
  minHeight: '38px',
  outline: 'none',
  boxShadow: 'none',
  backgroundColor: 'transparent',
  transition: 'none'
};

const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  subtitle,
  colorClass = 'text-primary',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timestamp,
  actionButton,
  isCollapsed = false,
  timeSlotSummary,
  onToggleCollapse,
  joinedCount,
  event,
}) => {
  const isMobile = useMediaQuery({ maxWidth: 575 });
  
  // Check if the event is confirmed
  const isConfirmed = event.status === 'CONFIRMED';
  
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
                  {isConfirmed && (
                    <span className="badge bg-success ms-2">
                      <i className="bi bi-check-circle me-1"></i>Confirmed
                    </span>
                  )}
                  {typeof joinedCount === 'number' && (
                    <span className="badge bg-secondary ms-2" style={{ fontSize: '0.8em' }} title="Players joined">
                      <i className="bi bi-people me-1"></i>{joinedCount}
                    </span>
                  )}
                </h6>
              </OverlayTrigger>
            </div>
            {subtitle && <small className={colorClass}>{subtitle}</small>}
            {isConfirmed && event.confirmation && (
              <div className="mt-1">
                <small className="text-success text-wrap d-block">
                  <div className="d-flex flex-wrap">
                    <div className="me-2">
                      <i className="bi bi-calendar-check me-1"></i>
                      {formatConfirmedDateTime(event.confirmation.datetime || '')}
                    </div>
                    <div>
                      <i className="bi bi-geo-alt me-1"></i>
                      <span className="text-break">{event.confirmation.location}</span>
                    </div>
                  </div>
                </small>
              </div>
            )}
            {/* Always show time slots in header regardless of collapsed state */}
            {timeSlotSummary && !isConfirmed && (
              <small className="text-muted text-wrap">
                <i className="bi bi-calendar-event me-1"></i>
                {timeSlotSummary}
              </small>
            )}
            <div className="d-flex flex-wrap gap-1 mt-1">
              <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '100%' }}>
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
            </div>
          </div>
        </div>
        {/* Right: Chevron and action button (desktop only) */}
        <div className="d-none d-sm-flex align-items-center gap-2 flex-shrink-0">
          {actionButton.customButton || (!actionButton.hidden && (
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
          ))}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm border-0"
            aria-label={isCollapsed ? 'Show details' : 'Hide details'}
            onClick={onToggleCollapse}
          >
            <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
          </button>
        </div>
      </div>
      {/* Action button for mobile only, full width */}
      <div className="d-flex d-sm-none mt-2">
        {actionButton.customButton || (!actionButton.hidden && (
          <Button
            variant={actionButton.variant}
            onClick={actionButton.onClick}
            className="w-100 d-flex justify-content-center align-items-center btn-no-state-change"
            style={{ ...buttonStyle, minHeight: '38px' }}
            disabled={actionButton.disabled}
          >
            <i className={`bi ${actionButton.icon} me-1`}></i>
            {actionButton.label}
          </Button>
        ))}
      </div>
      
      {/* Full-width expand/collapse button for mobile */}
      <div className="d-sm-none mt-2">
        <Button
          variant="outline-secondary"
          className="w-100 d-flex justify-content-center align-items-center btn-no-state-change"
          style={buttonStyle}
          onClick={onToggleCollapse}
        >
          <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'} me-2`}></i>
          {isCollapsed ? 'Show Details' : 'Hide Details'}
        </Button>
      </div>
    </div>
  );
};

export default EventHeader; 
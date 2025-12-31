import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton } from './types';
import { components } from '../../types/schema';
import { formatDuration } from '../../utils/dateUtils';
import { formatTimeSlotLocalized, formatUtcToLocalI18n } from '../../utils/i18nDateUtils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import TimeAgo from 'react-timeago';
import { getTimeAgoFormatter } from '../../utils/timeAgoFormatters';
import { getStatusInfo, formatLocationsList, shouldShowExpirationTime } from '../../utils/eventStatusUtils';

type ApiEvent = components['schemas']['ApiEvent'];

interface EventHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  actionButton: ActionButton;
  timeSlotSummary?: string;
  joinedCount?: number;
  event: ApiEvent;
  shareButton?: React.ReactNode;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  subtitle,
  actionButton,
  timeSlotSummary,
  joinedCount,
  event,
  shareButton,
}) => {
  const { t } = useTranslation();
  const isConfirmed = event.status === 'CONFIRMED';
  const statusInfo = getStatusInfo(event.status, t);

  const dateTimeDisplay = isConfirmed && event.confirmation?.datetime
    ? formatTimeSlotLocalized(event.confirmation.datetime)
    : timeSlotSummary;

  const locationsToShow = isConfirmed && event.confirmation?.location
    ? [event.confirmation.location]
    : event.locations || [];

  const { overflow: locationOverflow } = formatLocationsList(locationsToShow, 5);

  return (
    <div className="zone-card">
      {/* === ZONE 1: Identity === */}
      <div className="py-3">
        {/* Row 1: Title + Status + Share */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
            <h5 className="mb-0 fw-bold text-truncate"
                style={{ fontSize: '1.1rem', color: 'var(--tennis-navy)' }}>
              {title}
            </h5>
            <span className={`badge ${statusInfo.badgeVariant} flex-shrink-0`}
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    fontWeight: 600
                  }}>
              {statusInfo.text}
            </span>
          </div>
          <div className="flex-shrink-0 ms-2">
            {shareButton}
          </div>
        </div>

        {/* Row 2: Host */}
        {subtitle && (
          <div className="d-flex align-items-center text-muted mb-1"
               style={{ fontSize: '0.85rem' }}>
            <span className="d-flex align-items-center">
              <i className="bi bi-person me-1" style={{ fontSize: '0.9rem' }}></i>
              {subtitle}
            </span>
          </div>
        )}

        {/* Row 3: Looking for opponent level */}
        <div className="d-flex align-items-center"
             style={{ fontSize: '0.85rem' }}>
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id={`skill-${event.id}`}>
                {t(`createEvent.skillHints.${event.skillLevel}`)}
              </Tooltip>
            }
          >
            <span
              className="d-inline-flex align-items-center px-2 py-1"
              style={{
                cursor: 'help',
                backgroundColor: 'var(--navy-tint)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              <i className="bi bi-search me-1" style={{ fontSize: '0.7rem', color: 'var(--tennis-navy)' }}></i>
              <span style={{ color: 'var(--tennis-gray)' }}>{t('event.lookingFor')}:</span>
              <span className="ms-1" style={{ color: 'var(--tennis-navy)', fontWeight: 600 }}>
                {event.skillLevel}
              </span>
            </span>
          </OverlayTrigger>
        </div>
      </div>

      <div className="zone-divider" />

      {/* === ZONE 2: When/Where === */}
      <div className="py-3">
        {/* Date/Time Row */}
        <div className="d-flex align-items-start mb-2"
             style={{ fontSize: '0.9rem', color: 'var(--tennis-navy)' }}>
          <i className={`bi ${isConfirmed ? 'bi-calendar-check text-success' : 'bi-calendar-event'} me-2`}
             style={{ fontSize: '1rem', marginTop: '1px' }}></i>
          <div>
            <span className="fw-medium">{dateTimeDisplay}</span>
            <span className="text-muted ms-1">({formatDuration(event.sessionDuration)})</span>
          </div>
        </div>

        {/* Location Row */}
        {locationsToShow.length > 0 && (
          <div className="d-flex align-items-start"
               style={{ fontSize: '0.9rem', color: 'var(--tennis-navy)' }}>
            <i className="bi bi-geo-alt me-2 flex-shrink-0" style={{ fontSize: '1rem', marginTop: '2px' }}></i>
            <div className="d-flex flex-wrap gap-1 align-items-center">
              {locationsToShow.slice(0, 5).map((location, index) => (
                <React.Fragment key={location}>
                  {index > 0 && <span className="text-muted mx-1">·</span>}
                  <span
                    className="location-link"
                    style={{
                      borderBottom: '1px dotted var(--tennis-navy)',
                      cursor: 'pointer'
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {location}
                  </span>
                </React.Fragment>
              ))}
              {locationOverflow > 0 && (
                <span className="text-muted ms-1">+{locationOverflow} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="zone-divider" />

      {/* === ZONE 3: Meta & Actions === */}
      <div className="py-3">
        {/* Meta Row */}
        <div className="d-flex flex-wrap align-items-center gap-1 mb-3 text-muted"
             style={{ fontSize: '0.8rem' }}>
          <span>
            {t('common.created')}{' '}
            <TimeAgo
              date={event.createdAt || new Date()}
              formatter={getTimeAgoFormatter(i18n.language)}
            />
          </span>

          {shouldShowExpirationTime(event) && event.expirationTime && (
            <>
              <span>·</span>
              <span>
                {t('common.expires')}{' '}
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`exp-${event.id}`}>
                      {formatUtcToLocalI18n(event.expirationTime)}
                    </Tooltip>
                  }
                >
                  <span style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                    <TimeAgo
                      date={event.expirationTime}
                      formatter={getTimeAgoFormatter(i18n.language)}
                    />
                  </span>
                </OverlayTrigger>
              </span>
            </>
          )}

          {typeof joinedCount === 'number' && (
            <>
              <span>·</span>
              <span>
                <i className="bi bi-people me-1"></i>
                {joinedCount} {joinedCount === 1 ? 'ack' : 'acks'}
              </span>
            </>
          )}
        </div>

        {/* Status Badge (if present) */}
        {actionButton.statusBadge && (
          <div className="mb-2">
            <span className={`badge ${actionButton.statusBadge.variant} w-100 py-2 d-flex justify-content-center`}
                  style={{ fontSize: '0.75rem', borderRadius: '8px' }}>
              {actionButton.statusBadge.text}
            </span>
          </div>
        )}

        {/* Action Button */}
        {actionButton.customButton || (!actionButton.hidden && (
          <Button
            variant={actionButton.variant}
            onClick={actionButton.onClick}
            className="w-100"
            style={{
              minHeight: '44px',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '10px'
            }}
            disabled={actionButton.disabled}
          >
            <i className={`bi ${actionButton.icon} me-2`}></i>
            {actionButton.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EventHeader;

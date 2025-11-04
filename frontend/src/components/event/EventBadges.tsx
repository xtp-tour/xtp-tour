import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { components } from '../../types/schema';
import { formatDuration } from '../../utils/dateUtils';
import { BADGE_STYLES, NESTED_BADGE_STYLES } from '../../styles/badgeStyles';
import { useTranslation } from 'react-i18next';

type ApiEvent = components['schemas']['ApiEvent'];
type ApiEventType = ApiEvent['eventType'];
type ApiSkillLevel = ApiEvent['skillLevel'];

interface EventBadgesProps {
  skillLevel: ApiSkillLevel;
  sessionDuration: number;
}

const SkillLevelBadge: React.FC<{ skillLevel: ApiSkillLevel }> = ({ skillLevel }) => {
  const { t } = useTranslation();
  return (
  <OverlayTrigger
    placement="top"
    overlay={<Tooltip id={`skill-level-tooltip-${skillLevel}`}>{t(`createEvent.skillHints.${skillLevel}`)}</Tooltip>}
  >
    <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-blue)' }}>
      <span>{skillLevel}</span>
      <span className="badge bg-light" style={{ ...NESTED_BADGE_STYLES, color: 'var(--tennis-blue)' }}>
        {t(`createEvent.skillLabels.${skillLevel}`)}
      </span>
    </span>
  </OverlayTrigger>
  );
};

const DurationBadge: React.FC<{ minutes: number }> = ({ minutes }) => (
  <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-navy)' }}>
    <i className="bi bi-stopwatch me-1"></i>
    {formatDuration(minutes)}
  </span>
);

const RequestTypeBadge: React.FC<{ expectedPlayers: number }> = ({ expectedPlayers }) => {
  const { t } = useTranslation();

  const getRequestTypeLabel = (players: number): string => {
    switch (players) {
      case 2: return t('eventTypes.singles');
      case 4: return t('eventTypes.doubles');
      default: return t('eventTypes.players', { count: players });
    }
  };

  return (
    <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-light)', color: 'var(--tennis-navy)', border: '1px solid var(--tennis-navy)' }}>
      {getRequestTypeLabel(expectedPlayers)}
    </span>
  );
};

// Utility function to get event type label
// eslint-disable-next-line react-refresh/only-export-components
export const getEventTypeLabel = (type: ApiEventType, t: (key: string) => string): string => {
  switch (type) {
    case 'MATCH': return t('eventTypes.match');
    case 'TRAINING': return t('eventTypes.training');
    default: return type;
  }
};

const EventTypeBadge: React.FC<{ eventType: ApiEventType }> = ({ eventType }) => {
  const { t } = useTranslation();

  return (
    <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
      {getEventTypeLabel(eventType, t)}
    </span>
  );
};

const LocationBadge: React.FC<{
  location: string;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ location, isSelected, onClick }) => {
  // Clean up location name for display
  const cleanLocation = location.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const maxLength = 25;
  const displayLocation = cleanLocation.length > maxLength ? `${cleanLocation.slice(0, maxLength)}...` : cleanLocation;
  const showTooltip = cleanLocation.length > maxLength;

  const badge = (
    <span
      className="badge d-inline-flex align-items-center"
      style={{
        backgroundColor: isSelected ? 'var(--tennis-navy)' : '#f8f9fa',
        color: isSelected ? 'white' : 'var(--tennis-navy)',
        border: isSelected ? 'none' : '1px solid #e9ecef',
        cursor: onClick ? 'pointer' : undefined,
        fontSize: '0.8rem',
        fontWeight: '500',
        padding: '0.4rem 0.75rem',
        borderRadius: '8px',
        maxWidth: '200px',
        transition: 'all 0.2s ease-in-out'
      }}
      onMouseEnter={(e) => {
        if (onClick && !isSelected) {
          e.currentTarget.style.backgroundColor = '#e9ecef';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !isSelected) {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }
      }}
    >
      <i className="bi bi-geo-alt me-2 flex-shrink-0" style={{ fontSize: '0.9rem' }}></i>
      <span
        className="text-truncate"
        style={{
          minWidth: 0,
          maxWidth: '150px',
          display: 'inline-block'
        }}
      >
        {displayLocation}
      </span>
      {onClick && <i className="bi bi-chevron-right ms-2 opacity-75 flex-shrink-0" style={{ fontSize: '0.8rem' }}></i>}
    </span>
  );

  const badgeWithTooltip = showTooltip ? (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={`location-tooltip-${location}`}>{cleanLocation}</Tooltip>}
    >
      {badge}
    </OverlayTrigger>
  ) : badge;

  return onClick ? (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="text-decoration-none"
    >
      {badgeWithTooltip}
    </a>
  ) : (
    badgeWithTooltip
  );
};

const EventBadges: React.FC<EventBadgesProps> = ({
  skillLevel,
  sessionDuration,
}) => (
  <div className="d-flex flex-wrap gap-2 mb-3">
    <SkillLevelBadge skillLevel={skillLevel} />
    <DurationBadge minutes={sessionDuration} />
  </div>
);

export default EventBadges;
export { LocationBadge, EventTypeBadge, RequestTypeBadge, SkillLevelBadge, DurationBadge };
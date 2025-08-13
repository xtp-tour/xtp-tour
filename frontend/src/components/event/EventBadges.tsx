import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { components } from '../../types/schema';
import { SKILL_LEVEL_DESCRIPTIONS } from './types';
import { formatDuration } from '../../utils/dateUtils';
import { BADGE_STYLES, NESTED_BADGE_STYLES } from '../../styles/badgeStyles';

type ApiEvent = components['schemas']['ApiEvent'];
type ApiEventType = ApiEvent['eventType'];
type ApiSkillLevel = ApiEvent['skillLevel'];

interface EventBadgesProps {
  skillLevel: ApiSkillLevel;
  sessionDuration: number;
}

const SkillLevelBadge: React.FC<{ skillLevel: ApiSkillLevel }> = ({ skillLevel }) => (
  <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-blue)' }}>
    <span>{skillLevel}</span>
    <span className="badge bg-light" style={{ ...NESTED_BADGE_STYLES, color: 'var(--tennis-blue)' }}>
      {SKILL_LEVEL_DESCRIPTIONS[skillLevel]}
    </span>
  </span>
);

const DurationBadge: React.FC<{ minutes: number }> = ({ minutes }) => (
  <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-navy)' }}>
    <i className="bi bi-stopwatch me-1"></i>
    {formatDuration(minutes)}
  </span>
);

const RequestTypeBadge: React.FC<{ expectedPlayers: number }> = ({ expectedPlayers }) => {
  const getRequestTypeLabel = (players: number): string => {
    switch (players) {
      case 2: return 'Singles';
      case 4: return 'Doubles';
      default: return `${players} Players`;
    }
  };
  
  return (
    <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-light)', color: 'var(--tennis-navy)', border: '1px solid var(--tennis-navy)' }}>
      {getRequestTypeLabel(expectedPlayers)}
    </span>
  );
};

// Utility function to get event type label
export const getEventTypeLabel = (type: ApiEventType): string => {
  switch (type) {
    case 'MATCH': return 'Match';
    case 'TRAINING': return 'Training';
    default: return type;
  }
};

const EventTypeBadge: React.FC<{ eventType: ApiEventType }> = ({ eventType }) => {
  return (
    <span className="badge" style={{ ...BADGE_STYLES, backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
      {getEventTypeLabel(eventType)}
    </span>
  );
};

const LocationBadge: React.FC<{ 
  location: string;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ location, isSelected, onClick }) => {
  // Truncate location name if too long
  const maxLength = 20;
  const displayLocation = location.length > maxLength ? `${location.slice(0, maxLength)}...` : location;
  const showTooltip = location.length > maxLength;

  const badge = (
    <span 
      className="badge" 
      style={{ 
        ...BADGE_STYLES,
        backgroundColor: isSelected ? 'var(--tennis-navy)' : 'var(--tennis-accent)', 
        color: isSelected ? 'white' : 'var(--tennis-navy)',
        cursor: onClick ? 'pointer' : undefined,
        maxWidth: '200px'
      }}
    >
      <i className="bi bi-geo-alt me-1 flex-shrink-0"></i>
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
      {onClick && <i className="bi bi-chevron-right ms-1 opacity-75 flex-shrink-0"></i>}
    </span>
  );

  const badgeWithTooltip = showTooltip ? (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={`location-tooltip-${location}`}>{location}</Tooltip>}
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
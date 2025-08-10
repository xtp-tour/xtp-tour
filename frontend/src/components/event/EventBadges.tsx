import React from 'react';
import { components } from '../../types/schema';
import { SKILL_LEVEL_DESCRIPTIONS } from './types';
import { formatDuration } from '../../utils/dateUtils';

type ApiEvent = components['schemas']['ApiEvent'];
type ApiEventType = ApiEvent['eventType'];
type ApiSkillLevel = ApiEvent['skillLevel'];

interface EventBadgesProps {
  skillLevel: ApiSkillLevel;
  sessionDuration: number;
}

const SkillLevelBadge: React.FC<{ skillLevel: ApiSkillLevel }> = ({ skillLevel }) => (
  <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: 'var(--tennis-blue)' }}>
    <span>{skillLevel}</span>
    <span className="badge bg-light" style={{ fontSize: '0.75em', color: 'var(--tennis-blue)' }}>
      {SKILL_LEVEL_DESCRIPTIONS[skillLevel]}
    </span>
  </span>
);

const DurationBadge: React.FC<{ minutes: number }> = ({ minutes }) => (
  <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-navy)' }}>
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
    <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-light)', color: 'var(--tennis-navy)', border: '1px solid var(--tennis-navy)' }}>
      {getRequestTypeLabel(expectedPlayers)}
    </span>
  );
};

const EventTypeBadge: React.FC<{ eventType: ApiEventType }> = ({ eventType }) => {
  const getEventTypeLabel = (type: ApiEventType): string => {
    switch (type) {
      case 'MATCH': return 'Match';
      case 'TRAINING': return 'Training';
      default: return type;
    }
  };
  
  return (
    <span className="badge d-inline-flex align-items-center " style={{ backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
      {getEventTypeLabel(eventType)}
    </span>
  );
};

const LocationBadge: React.FC<{ 
  location: string;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ location, isSelected, onClick }) => {
  const badge = (
    <span 
      className="badge d-inline-flex align-items-center" 
      style={{ 
        backgroundColor: isSelected ? 'var(--tennis-navy)' : 'var(--tennis-accent)', 
        color: isSelected ? 'white' : 'var(--tennis-navy)',
        padding: '0.35em 0.65em',
        fontSize: '0.75rem',
        cursor: onClick ? 'pointer' : undefined
      }}
    >
      <i className="bi bi-geo-alt me-1"></i>
      {location}
      {onClick && <i className="bi bi-chevron-right ms-1 opacity-75"></i>}
    </span>
  );
  
  return onClick ? (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="text-decoration-none"
    >
      {badge}
    </a>
  ) : (
    badge
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
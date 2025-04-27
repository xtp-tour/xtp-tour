import React from 'react';
import { components } from '../../types/schema';
import { SKILL_LEVEL_DESCRIPTIONS, getEventTypeLabel, getRequestTypeLabel } from './types';

type ApiEvent = components['schemas']['ApiEvent'];
type ApiEventType = ApiEvent['eventType'];
type ApiSkillLevel = ApiEvent['skillLevel'];

interface EventBadgesProps {
  eventType: ApiEventType;  
  expectedPlayers: number;
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

const DurationBadge: React.FC<{ hours: number }> = ({ hours }) => (
  <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-navy)' }}>
    <i className="bi bi-stopwatch me-1"></i>
    {hours} {hours === 1 ? 'hour' : 'hours'}
  </span>
);

const RequestTypeBadge: React.FC<{ expectedPlayers: number }> = ({ expectedPlayers }) => (
  <span className="badge d-inline-flex align-items-center" style={{ backgroundColor: 'var(--tennis-light)', color: 'var(--tennis-navy)', border: '1px solid var(--tennis-navy)' }}>
    {getRequestTypeLabel(expectedPlayers)}
  </span>
);

const EventTypeBadge: React.FC<{ eventType: ApiEventType }> = ({ eventType }) => (
  <span className="badge d-inline-flex align-items-center " style={{ backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
    {getEventTypeLabel(eventType)}
  </span>
);

const EventBadges: React.FC<EventBadgesProps> = ({
  eventType,
  expectedPlayers,
  skillLevel,
  sessionDuration,
}) => (
  <div className="d-flex flex-wrap gap-2 mb-3">
    <EventTypeBadge eventType={eventType} />
    <RequestTypeBadge expectedPlayers={expectedPlayers} />    
    <SkillLevelBadge skillLevel={skillLevel} />
    <DurationBadge hours={sessionDuration} />
  </div>
);

export default EventBadges; 
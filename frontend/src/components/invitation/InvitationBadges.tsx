import React from 'react';
import { ActivityType, SingleDoubleType, SkillLevel } from '../../types/invitation';
import { SKILL_LEVEL_DESCRIPTIONS, getInvitationTypeLabel, getRequestTypeLabel } from './types';

interface InvitationBadgesProps {
  invitationType: ActivityType;
  requestType: SingleDoubleType;
  skillLevel: SkillLevel;
  sessionDuration: number;
}

const SkillLevelBadge: React.FC<{ skillLevel: SkillLevel }> = ({ skillLevel }) => (
  <span className="badge bg-info d-inline-flex align-items-center gap-1">
    <span>{skillLevel}</span>
    <span className="badge bg-light text-info" style={{ fontSize: '0.75em' }}>
      {SKILL_LEVEL_DESCRIPTIONS[skillLevel]}
    </span>
  </span>
);

const DurationBadge: React.FC<{ hours: number }> = ({ hours }) => (
  <span className="badge bg-dark">
    <i className="bi bi-stopwatch me-1"></i>
    {hours} {hours === 1 ? 'hour' : 'hours'}
  </span>
);

const InvitationBadges: React.FC<InvitationBadgesProps> = ({
  invitationType,
  requestType,
  skillLevel,
  sessionDuration,
}) => (
  <div className="d-flex gap-2 mb-4">
    <span className="badge bg-primary">{getInvitationTypeLabel(invitationType)}</span>
    <span className="badge bg-secondary">{getRequestTypeLabel(requestType)}</span>
    <SkillLevelBadge skillLevel={skillLevel} />
    <DurationBadge hours={sessionDuration} />
  </div>
);

export default InvitationBadges; 
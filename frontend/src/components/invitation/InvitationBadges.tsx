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
  <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: 'var(--tennis-blue)' }}>
    <span>{skillLevel}</span>
    <span className="badge bg-light" style={{ fontSize: '0.75em', color: 'var(--tennis-blue)' }}>
      {SKILL_LEVEL_DESCRIPTIONS[skillLevel]}
    </span>
  </span>
);

const DurationBadge: React.FC<{ hours: number }> = ({ hours }) => (
  <span className="badge" style={{ backgroundColor: 'var(--tennis-navy)' }}>
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
  <div className="d-flex flex-wrap gap-2 mb-3">
    <span className="badge mb-1" style={{ backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
      {getInvitationTypeLabel(invitationType)}
    </span>
    <span className="badge mb-1" style={{ backgroundColor: 'var(--tennis-light)', color: 'var(--tennis-navy)', border: '1px solid var(--tennis-navy)' }}>
      {getRequestTypeLabel(requestType)}
    </span>
    <SkillLevelBadge skillLevel={skillLevel} />
    <DurationBadge hours={sessionDuration} />
  </div>
);

export default InvitationBadges; 
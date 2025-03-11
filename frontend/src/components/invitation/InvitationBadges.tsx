import React from 'react';
import { InvitationType, RequestType } from '../../types/invitation';
import { SKILL_LEVEL_DESCRIPTIONS, getInvitationTypeLabel, getRequestTypeLabel } from './types';

interface InvitationBadgesProps {
  invitationType: InvitationType;
  requestType: RequestType;
  skillLevel: string;
  matchDuration: number;
}

const SkillLevelBadge: React.FC<{ skillLevel: string }> = ({ skillLevel }) => (
  <span className="badge bg-info d-inline-flex align-items-center gap-1">
    <span>{skillLevel}</span>
    <span className="badge bg-light text-info" style={{ fontSize: '0.75em' }}>
      {SKILL_LEVEL_DESCRIPTIONS[skillLevel as keyof typeof SKILL_LEVEL_DESCRIPTIONS] || skillLevel}
    </span>
  </span>
);

const DurationBadge: React.FC<{ minutes: number }> = ({ minutes }) => (
  <span className="badge bg-dark">
    <i className="bi bi-stopwatch me-1"></i>
    {minutes} min
  </span>
);

const InvitationBadges: React.FC<InvitationBadgesProps> = ({
  invitationType,
  requestType,
  skillLevel,
  matchDuration,
}) => (
  <div className="d-flex gap-2 mb-4">
    <span className="badge bg-primary">{getInvitationTypeLabel(invitationType)}</span>
    <span className="badge bg-secondary">{getRequestTypeLabel(requestType)}</span>
    <SkillLevelBadge skillLevel={skillLevel} />
    <DurationBadge minutes={matchDuration * 60} />
  </div>
);

export default InvitationBadges; 
import React from 'react';
import { ActivityType, SkillLevel } from '../../types/invitation';
import { SKILL_LEVEL_DESCRIPTIONS, getInvitationTypeLabel, getRequestTypeLabel } from './types';

interface InvitationBadgesProps {
  invitationType: ActivityType;  
  expectedPlayers: number;
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

const InvitationTypeBadge: React.FC<{ invitationType: ActivityType }> = ({ invitationType }) => (
  <span className="badge d-inline-flex align-items-center " style={{ backgroundColor: 'var(--tennis-accent)', color: 'var(--tennis-navy)' }}>
    {getInvitationTypeLabel(invitationType)}
  </span>
);



const InvitationBadges: React.FC<InvitationBadgesProps> = ({
  invitationType,
  expectedPlayers,
  skillLevel,
  sessionDuration,
}) => (
  <div className="d-flex flex-wrap gap-2 mb-3">
    <InvitationTypeBadge invitationType={invitationType} />
    <RequestTypeBadge expectedPlayers={expectedPlayers} />    
    <SkillLevelBadge skillLevel={skillLevel} />
    <DurationBadge hours={sessionDuration} />
  </div>
);

export default InvitationBadges; 
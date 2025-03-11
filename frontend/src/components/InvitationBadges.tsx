import React from 'react';
import { InvitationType, RequestType } from '../types/invitation';

interface InvitationBadgesProps {
  invitationType: InvitationType;
  requestType: RequestType;
  skillLevel: string;
  matchDuration: number;
}

const InvitationBadges: React.FC<InvitationBadgesProps> = ({
  invitationType,
  requestType,
  skillLevel,
  matchDuration,
}) => {
  const getInvitationTypeLabel = (type: InvitationType) => {
    switch (type) {
      case InvitationType.Match:
        return 'Match';
      case InvitationType.Training:
        return 'Training';
      default:
        return type;
    }
  };

  const getRequestTypeLabel = (type: RequestType) => {
    switch (type) {
      case RequestType.Single:
        return 'Single';
      case RequestType.Doubles:
        return 'Doubles';
      default:
        return type;
    }
  };

  return (
    <div className="d-flex gap-2 mb-4">
      <span className="badge bg-primary">{getInvitationTypeLabel(invitationType)}</span>
      <span className="badge bg-secondary">{getRequestTypeLabel(requestType)}</span>
      <span className="badge bg-info d-inline-flex align-items-center gap-1">
        <span>{skillLevel}</span>
        <span className="badge bg-light text-info" style={{ fontSize: '0.75em' }}>
          {skillLevel === 'ANY' ? 'Any NTRP' :
           skillLevel === 'BEGINNER' ? 'NTRP < 3.5' :
           skillLevel === 'INTERMEDIATE' ? 'NTRP 3.5–5.0' :
           'NTRP > 5.0'}
        </span>
      </span>
      <span className="badge bg-dark">
        <i className="bi bi-stopwatch me-1"></i>
        {matchDuration * 60} min
      </span>
    </div>
  );
};

export default InvitationBadges; 
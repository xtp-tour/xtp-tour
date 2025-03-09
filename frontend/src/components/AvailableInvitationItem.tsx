import React, { useState } from 'react';
import { Invitation, InvitationType, RequestType } from '../types/invitation';
import { formatTime } from '../utils/dateUtils';
import { AcceptInvitationModal } from './AcceptInvitationModal';

interface Props {
  invitation: Invitation;
}

const AvailableInvitationItem: React.FC<Props> = ({ invitation }) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);

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
    <>
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="card-title">
                {invitation.locations.map(loc => loc).join(', ')}
              </h5>
              <h6 className="card-subtitle mb-2 text-muted">By {invitation.playerId}</h6>
              <p className="card-text">
                <span className="badge bg-primary me-2">{getInvitationTypeLabel(invitation.invitationType)}</span>
                <span className="badge bg-secondary me-2">{getRequestTypeLabel(invitation.requestType)}</span>
                <span className="badge bg-info">{invitation.skillLevel}</span>
              </p>
              {invitation.description && (
                <p className="card-text">
                  <small className="text-muted">{invitation.description}</small>
                </p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <h6>Available Dates:</h6>
            <ul className="list-unstyled">
              {invitation.dates.map((date, index) => (
                <li key={index} className="mb-1">
                  <i className="bi bi-calendar-event me-2"></i>
                  {date.date.toLocaleDateString()} {' '}
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(date.timespan.from)} - {formatTime(date.timespan.to)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <small className="text-muted">
              <i className="bi bi-clock-history me-1"></i>
              Created {invitation.createdAt.toLocaleDateString()}
              {invitation.updatedAt && ` • Updated ${invitation.updatedAt.toLocaleDateString()}`}
            </small>
          </div>
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => setShowAcceptModal(true)}
          >
            Accept Invitation
          </button>
        </div>
      </div>

      <AcceptInvitationModal
        invitationId={invitation.id}
        hostName={invitation.playerId}
        show={showAcceptModal}
        onHide={() => setShowAcceptModal(false)}
        onAccepted={() => {
          // Refresh the invitations list
          window.location.reload();
        }}
      />
    </>
  );
};

export default AvailableInvitationItem; 
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

  const handleLocationClick = (locationId: string) => {
    // In a real app, this would navigate to the location details page
    console.log('Navigate to location:', locationId);
  };

  return (
    <>
      <div className="card mb-3">
        <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                <i className="bi bi-person-circle text-primary"></i>
              </div>
            </div>
            <div>
              <h6 className="mb-0">{invitation.playerId}</h6>
            </div>
          </div>
          <div>
            <small className="text-muted">
              <i className="bi bi-clock-history me-1"></i>
              {new Date().getTime() - invitation.createdAt.getTime() < 24 * 60 * 60 * 1000 
                ? `${Math.round((new Date().getTime() - invitation.createdAt.getTime()) / (60 * 60 * 1000))}h ago`
                : invitation.createdAt.toLocaleDateString()}
            </small>
          </div>
        </div>

        <div className="card-body">
          <div className="d-flex gap-2 mb-4">
            <span className="badge bg-primary">{getInvitationTypeLabel(invitation.invitationType)}</span>
            <span className="badge bg-secondary">{getRequestTypeLabel(invitation.requestType)}</span>
            <span className="badge bg-info">{invitation.skillLevel}</span>
            <span className="badge bg-dark">
              <i className="bi bi-stopwatch me-1"></i>
              {invitation.matchDuration * 60} min
            </span>
          </div>

          <div className="mb-4">
            <h6 className="text-muted mb-3">Preferred Locations</h6>
            <div className="d-flex flex-wrap gap-2">
              {invitation.locations.map(loc => (
                <a
                  key={loc}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLocationClick(loc);
                  }}
                  className="text-decoration-none"
                >
                  <div className="badge bg-light text-dark border border-primary border-opacity-25 p-2">
                    <i className="bi bi-geo-alt me-1 text-primary"></i>
                    {loc}
                    <i className="bi bi-chevron-right ms-1 text-primary opacity-75"></i>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h6 className="text-muted mb-3">Available Times</h6>
            <div className="d-flex flex-column gap-1">
              {invitation.dates.map((date, index) => (
                <div key={index} className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-event text-primary"></i>
                  <span className="fw-medium text-nowrap">{date.date.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                  <i className="bi bi-clock text-muted"></i>
                  <span className="text-muted text-nowrap">
                    {formatTime(date.timespan.from)} - {formatTime(date.timespan.to)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {invitation.description && (
            <div className="mb-4">
              <h6 className="text-muted mb-3">Description</h6>
              <div className="card bg-light border-0">
                <div className="card-body">                  
                  <p className="card-text mb-0 ps-4">
                    {invitation.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary w-100" 
            onClick={() => setShowAcceptModal(true)}
          >
            <i className="bi bi-check2-circle me-2"></i>
            Join Game Session
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
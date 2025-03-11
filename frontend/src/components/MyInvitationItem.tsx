import React from 'react';
import { Invitation, InvitationType, RequestType } from '../types/invitation';
import { formatTime } from '../utils/dateUtils';

interface Props {
  invitation: Invitation;
  onDelete: (id: string) => Promise<void>;
}

const MyInvitationItem: React.FC<Props> = ({ invitation, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      await onDelete(invitation.id);
    }
  };

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
    <div className="card mb-3">
      <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
        <div className="d-flex align-items-center">
          <div className="me-2">
            <div className="rounded-circle bg-primary bg-opacity-10 p-2">
              <i className="bi bi-person-circle text-primary"></i>
            </div>
          </div>
          <div>
            <h6 className="mb-0">Your Invitation</h6>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted">
            <i className="bi bi-clock-history me-1"></i>
            {new Date().getTime() - invitation.createdAt.getTime() < 24 * 60 * 60 * 1000 
              ? `${Math.round((new Date().getTime() - invitation.createdAt.getTime()) / (60 * 60 * 1000))}h ago`
              : invitation.createdAt.toLocaleDateString()}
          </small>
          <button 
            className="btn btn-outline-danger btn-sm" 
            onClick={handleDelete}
            title="Delete invitation"
          >
            <i className="bi bi-trash"></i>
          </button>
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
              <div key={loc} className="badge bg-light text-dark border border-primary border-opacity-25 p-2">
                <i className="bi bi-geo-alt me-1 text-primary"></i>
                {loc}
              </div>
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
      </div>
    </div>
  );
};

export default MyInvitationItem; 
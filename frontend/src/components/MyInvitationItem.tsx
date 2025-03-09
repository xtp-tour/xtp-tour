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
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title">
              {invitation.locations.map(loc => loc).join(', ')}
            </h5>
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
          <button 
            className="btn btn-outline-danger btn-sm" 
            onClick={handleDelete}
            title="Delete invitation"
          >
            <i className="bi bi-trash"></i>
          </button>
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
      </div>
    </div>
  );
};

export default MyInvitationItem; 
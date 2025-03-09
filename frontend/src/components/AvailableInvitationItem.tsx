import React from 'react';
import { Invitation } from '../types/invitation';

interface Props {
  invitation: Invitation;
}

const AvailableInvitationItem: React.FC<Props> = ({ invitation }) => {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{invitation.location}</h5>
        <h6 className="card-subtitle mb-2 text-muted">By {invitation.playerName}</h6>
        <p className="card-text">
          <small className="text-muted">Skill Level: {invitation.skillLevel}</small>
        </p>
        <div className="mt-3">
          <h6>Available Dates:</h6>
          <ul className="list-unstyled">
            {invitation.dates.map((date, index) => (
              <li key={index}>
                {date.date.toLocaleDateString()} {' '}
                {String(date.timespan.from).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')} - {' '}
                {String(date.timespan.to).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn btn-primary mt-3">
          Accept Invitation
        </button>
      </div>
    </div>
  );
};

export default AvailableInvitationItem; 
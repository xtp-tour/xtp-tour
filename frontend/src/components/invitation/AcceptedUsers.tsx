import React from 'react';
import { Acks } from '../../types/invitation';
import { AckStatus } from '../../types/invitation';

interface AcceptedUsersProps {
  acks: Acks[];
}

const AcceptedUsers: React.FC<AcceptedUsersProps> = ({ acks }) => {
  const pendingAcks = acks.filter(ack => ack.status === AckStatus.Pending);
  
  if (pendingAcks.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="d-flex align-items-center mb-2">
        <i className="bi bi-people-fill me-2" style={{ color: 'var(--tennis-accent)' }}></i>
        <h6 className="mb-0" style={{ color: 'var(--tennis-navy)' }}>Accepted by</h6>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {pendingAcks.map(ack => (
          <div 
            key={ack.userId}
            className="d-flex align-items-center bg-light rounded-pill px-3 py-1"
            style={{ border: '1px solid var(--tennis-light)' }}
          >
            <i className="bi bi-person-circle me-2" style={{ color: 'var(--tennis-accent)' }}></i>
            <span style={{ color: 'var(--tennis-navy)' }}>{ack.userId}</span>
            {ack.comment && (
              <span className="ms-2 text-muted small">
                <i className="bi bi-chat-dots me-1"></i>
                {ack.comment}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcceptedUsers; 
import React from 'react';
import { Button } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';

interface InvitationHeaderProps extends StyleProps {
  title: string;
  subtitle?: string;
  timestamp: Date;
  actionButton: ActionButton;
}

const formatTimestamp = (timestamp: Date): string => {
  const hoursDiff = Math.round((new Date().getTime() - timestamp.getTime()) / (60 * 60 * 1000));
  return hoursDiff < 24 ? `${hoursDiff}h ago` : timestamp.toLocaleDateString();
};

const InvitationHeader: React.FC<InvitationHeaderProps> = ({
  title,
  subtitle,
  colorClass = 'text-primary',
  timestamp,
  actionButton,
}) => (
  <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
    <div className="d-flex align-items-center">
      <div className="me-2">
        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
          <i className={`bi bi-person-circle ${colorClass} fs-4`}></i>
        </div>
      </div>
      <div>
        <h6 className="mb-0">{title}</h6>
        {subtitle && <small className={colorClass}>{subtitle}</small>}
      </div>
    </div>
    <div className="d-flex align-items-center gap-3">
      <small className="text-muted">
        <i className="bi bi-clock-history me-1"></i>
        {formatTimestamp(timestamp)}
      </small>
      {actionButton.customButton || (
        <Button
          variant={actionButton.variant}
          onClick={actionButton.onClick}
          style={{ minWidth: '100px' }}
          disabled={actionButton.disabled}
        >
          <i className={`bi ${actionButton.icon} me-1`}></i>
          {actionButton.label}
        </Button>
      )}
    </div>
  </div>
);

export default InvitationHeader; 
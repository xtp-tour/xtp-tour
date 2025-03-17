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
  <div className="card-header bg-white p-2">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div className="d-flex align-items-center">
        <div className="me-2">
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <i className={`bi bi-person-circle ${colorClass} fs-4`}></i>
          </div>
        </div>
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center gap-2">
            <h6 className="mb-0">{title}</h6>
            <small className="text-muted">
              <i className="bi bi-clock-history me-1"></i>
              {formatTimestamp(timestamp)}
            </small>
          </div>
          {subtitle && <small className={colorClass}>{subtitle}</small>}
        </div>
      </div>
      <div>
        {actionButton.customButton || (
          <Button
            variant={actionButton.variant}
            onClick={actionButton.onClick}
            className="text-nowrap"
            style={{ minWidth: '90px' }}
            disabled={actionButton.disabled}
          >
            <i className={`bi ${actionButton.icon} me-1`}></i>
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default InvitationHeader; 
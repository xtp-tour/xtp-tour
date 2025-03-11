import React from 'react';
import { Button } from 'react-bootstrap';

interface InvitationHeaderProps {
  title: string;
  subtitle?: string;
  avatarColorClass?: string;
  timestamp: Date;
  actionButton: {
    variant: string;
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

const InvitationHeader: React.FC<InvitationHeaderProps> = ({
  title,
  subtitle,
  avatarColorClass = 'text-primary',
  timestamp,
  actionButton,
}) => {
  return (
    <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
      <div className="d-flex align-items-center">
        <div className="me-2">
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <i className={`bi bi-person-circle ${avatarColorClass} fs-4`}></i>
          </div>
        </div>
        <div>
          <h6 className="mb-0">{title}</h6>
          {subtitle && <small className={avatarColorClass}>{subtitle}</small>}
        </div>
      </div>
      <div className="d-flex align-items-center gap-3">
        <small className="text-muted">
          <i className="bi bi-clock-history me-1"></i>
          {new Date().getTime() - timestamp.getTime() < 24 * 60 * 60 * 1000 
            ? `${Math.round((new Date().getTime() - timestamp.getTime()) / (60 * 60 * 1000))}h ago`
            : timestamp.toLocaleDateString()}
        </small>
        <Button
          variant={actionButton.variant}
          onClick={actionButton.onClick}
          style={{ minWidth: '100px' }}
          disabled={actionButton.disabled}
        >
          <i className={`bi ${actionButton.icon} me-1`}></i>
          {actionButton.label}
        </Button>
      </div>
    </div>
  );
};

export default InvitationHeader; 
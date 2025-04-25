import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ActionButton, StyleProps } from './types';
import moment from 'moment';
import TimeAgo from 'react-timeago';

interface InvitationHeaderProps extends StyleProps {
  title: string;
  subtitle?: string;
  timestamp: moment.Moment;
  actionButton: ActionButton;
}

const formatFullTimestamp = (timestamp: moment.Moment): string => {
  return timestamp.format('MMMM D, YYYY h:mm:ss A');
};

const InvitationHeader: React.FC<InvitationHeaderProps> = ({
  title,
  subtitle,
  colorClass = 'text-primary',
  timestamp,
  actionButton,
}) => {
  // Ensure we have a valid Moment object
  const momentTimestamp = moment.isMoment(timestamp) ? timestamp : moment(timestamp);
  
  return (
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
              <OverlayTrigger
                placement="bottom"
                overlay={
                  <Tooltip id={`timestamp-tooltip-${momentTimestamp.valueOf()}`}>
                    {formatFullTimestamp(momentTimestamp)}
                  </Tooltip>
                }
              >
                <small className="text-muted">
                  <i className="bi bi-clock-history me-1"></i>
                  <TimeAgo date={momentTimestamp.toDate()} />
                </small>
              </OverlayTrigger>
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
};

export default InvitationHeader; 
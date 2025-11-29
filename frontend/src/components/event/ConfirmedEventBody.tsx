import React from 'react';
import { components } from '../../types/schema';
import EventDescription from './EventDescription';
import JoinedUsers from './JoinedUsers';
import { StyleProps, TimeSlot } from './types';
import moment from 'moment';
import TimeAgo from 'react-timeago';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { LocationBadge } from './EventBadges';
import { useTranslation } from 'react-i18next';

type ApiEvent = components['schemas']['ApiEvent'];

interface ConfirmedEventBodyProps extends StyleProps {
  event: ApiEvent;
  timeSlots: TimeSlot[];
  timestamp: moment.Moment;
  children?: React.ReactNode;
}

const formatFullTimestamp = (timestamp: moment.Moment): string => {
  return timestamp.format('LLLL');
};

const formatConfirmedDateTime = (datetime: string): string => {
  return moment(datetime).format('LLLL');
};

const ConfirmedEventBody: React.FC<ConfirmedEventBodyProps> = ({
  event,
  colorClass = 'text-primary',
  timestamp,
  children,
}) => {
  const { t } = useTranslation();
  const momentTimestamp = moment.isMoment(timestamp) ? timestamp : moment(timestamp);

  if (!event.confirmation) {
    return null;
  }

  return (
    <div className="card-body pt-2">
      {/* Created At Timestamp */}
      <div className="mb-3">
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id={`timestamp-tooltip-${momentTimestamp.valueOf()}`}>
              {formatFullTimestamp(momentTimestamp)}
            </Tooltip>
          }
        >
          <div className="d-flex align-items-center small text-muted">
            <i className="bi bi-clock-history me-2"></i>
            <span>{t('common.created')} <TimeAgo date={momentTimestamp.toDate()} /></span>
          </div>
        </OverlayTrigger>
      </div>
      
      {/* Confirmed Event Details */}
      <div className="mb-4">
        <h6 className={`${colorClass} mb-3`}>
          <i className="bi bi-check-circle-fill me-2"></i>
          Confirmed Event Details
        </h6>
        
        <div className="card bg-light border-0">
          <div className="card-body py-3">
            <div className="d-flex flex-column">
              <div className="mb-2">
                <i className={`bi bi-calendar-check ${colorClass} me-2`}></i>
                <span className="fw-medium">Date & Time:</span>
                <span className="ms-2">{formatConfirmedDateTime(event.confirmation.datetime || '')}</span>
              </div>
              
              <div className="mb-2">
                <i className={`bi bi-geo-alt ${colorClass} me-2`}></i>
                <span className="fw-medium">Location:</span>
                <span className="ms-2">
                  <LocationBadge location={event.confirmation.location || ''} />
                </span>
              </div>
              
              <div>
                <i className={`bi bi-people ${colorClass} me-2`}></i>
                <span className="fw-medium">Players:</span>
                <span className="ms-2">
                  {event.joinRequests?.filter(jr => jr.isRejected !== true).length || 0} confirmed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EventDescription
        description={event.description}
      />

      <JoinedUsers joinRequests={event.joinRequests || []} />

      {children}
    </div>
  );
};

export default ConfirmedEventBody; 
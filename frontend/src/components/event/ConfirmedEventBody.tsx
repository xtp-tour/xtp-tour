import React from 'react';
import { components } from '../../types/schema';
import EventDescription from './EventDescription';
import JoinedUsers from './JoinedUsers';
import { StyleProps, TimeSlot } from './types';
import moment from 'moment';
import { LocationBadge } from './EventBadges';

type ApiEvent = components['schemas']['ApiEvent'];

interface ConfirmedEventBodyProps extends StyleProps {
  event: ApiEvent;
  timeSlots: TimeSlot[];
  children?: React.ReactNode;
}

const formatConfirmedDateTime = (datetime: string): string => {
  return moment(datetime).format('LLLL');
};

const ConfirmedEventBody: React.FC<ConfirmedEventBodyProps> = ({
  event,
  colorClass = 'text-primary',
  children,
}) => {
  if (!event.confirmation) {
    return null;
  }

  return (
    <div className="card-body pt-2">
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
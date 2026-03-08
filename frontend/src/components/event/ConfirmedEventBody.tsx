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

const formatGoogleCalendarDate = (datetime: string): string => {
  return moment(datetime).utc().format('YYYYMMDDTHHmmss') + 'Z';
};

const buildGoogleCalendarURL = (event: ApiEvent, locationName: string): string => {
  const start = formatGoogleCalendarDate(event.confirmation!.datetime || '');
  const end = formatGoogleCalendarDate(
    moment(event.confirmation!.datetime).add(event.sessionDuration, 'minutes').toISOString()
  );
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Tennis at ${locationName}`,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: locationName,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const ConfirmedEventBody: React.FC<ConfirmedEventBodyProps> = ({
  event,
  colorClass = 'text-primary',
  children,
}) => {
  if (!event.confirmation) {
    return null;
  }

  const locationName = (event.confirmation.location || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase());

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

        {/* Add to Calendar buttons */}
        <div className="d-flex gap-2 mt-3">
          <a
            href={buildGoogleCalendarURL(event, locationName)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-google me-1"></i>
            Add to Google Calendar
          </a>
          <a
            href={`/api/events/public/${event.id}/calendar.ics`}
            download
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="bi bi-calendar-plus me-1"></i>
            Download .ics
          </a>
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
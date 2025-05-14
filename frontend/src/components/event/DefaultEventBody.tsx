import React from 'react';
import { components } from '../../types/schema';
import EventLocations from './EventLocations';
import EventTimeSlots from './EventTimeSlots';
import EventDescription from './EventDescription';
import JoinedUsers from './JoinedUsers';
import { StyleProps, TimeSlot } from './types';
import moment from 'moment';
import TimeAgo from 'react-timeago';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

type ApiEvent = components['schemas']['ApiEvent'];

interface DefaultEventBodyProps extends StyleProps {
  event: ApiEvent;
  timeSlots: TimeSlot[];
  timestamp: moment.Moment;
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
  children?: React.ReactNode;
  isMyEvent?: boolean;
}

const formatFullTimestamp = (timestamp: moment.Moment): string => {
  return timestamp.format('MMMM D, YYYY [at] h:mm A');
};

const DefaultEventBody: React.FC<DefaultEventBodyProps> = ({
  event,
  colorClass = 'text-primary',
  borderColorClass = 'border-primary',
  timeSlots,
  timestamp,
  userSelectedLocations,
  onLocationClick,
  onTimeSlotClick,
  children,
  isMyEvent = false,
}) => {
  const momentTimestamp = moment.isMoment(timestamp) ? timestamp : moment(timestamp);

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
            <span>Created <TimeAgo date={momentTimestamp.toDate()} /></span>
          </div>
        </OverlayTrigger>
      </div>

      <EventLocations
        locations={event.locations}
        selectedLocations={event.confirmation?.location ? [event.confirmation.location] : undefined}
        userSelectedLocations={userSelectedLocations}
        colorClass={colorClass}
        borderColorClass={borderColorClass}
        onLocationClick={onLocationClick}
      />

      <EventTimeSlots
        timeSlots={timeSlots}
        hasSelectedTimeSlots={!!event.confirmation}
        onTimeSlotClick={onTimeSlotClick}
      />

      <EventDescription
        description={event.description}
      />

      <JoinedUsers joinRequests={event.joinRequests || []} />

      {/* Display detailed list of users who want to join (for my events) */}
      {isMyEvent && event.joinRequests && event.joinRequests.length > 0 && (
        <div className="mt-4">
          <h6 className="mb-3 text-muted">Players who want to join</h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Locations</th>
                  <th>Timeslots</th>
                </tr>
              </thead>
              <tbody>
                {event.joinRequests.map(jr => (
                  <tr key={jr.id}>
                    <td>{jr.userId || 'Unknown'}</td>
                    <td>
                      {jr.status === 'ACCEPTED' ? (
                        <span className="badge bg-success">Accepted</span>
                      ) : jr.status === 'WAITING' ? (
                        <span className="badge bg-warning text-dark">Waiting</span>
                      ) : jr.status === 'REJECTED' ? (
                        <span className="badge bg-danger">Rejected</span>
                      ) : jr.status === 'CANCELLED' ? (
                        <span className="badge bg-secondary">Cancelled</span>
                      ) : (
                        <span className="badge bg-light text-dark">{jr.status}</span>
                      )}
                    </td>
                    <td>{(jr.locations || []).join(', ')}</td>
                    <td>{(jr.timeSlots || []).map(ts => moment(ts).format('MMM D, h:mm A')).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default DefaultEventBody; 
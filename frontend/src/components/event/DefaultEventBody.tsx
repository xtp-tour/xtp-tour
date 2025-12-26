import React from 'react';
import { components } from '../../types/schema';
import EventLocations from './EventLocations';
import EventTimeSlots from './EventTimeSlots';
import EventDescription from './EventDescription';
import JoinedUsers from './JoinedUsers';
import UserDisplay from '../UserDisplay';
import { TimeSlot } from './types';
import { BADGE_STYLES } from '../../styles/badgeStyles';
import { formatTimeSlotLocalized } from '../../utils/i18nDateUtils';

type ApiEvent = components['schemas']['ApiEvent'];

interface DefaultEventBodyProps {
  event: ApiEvent;
  timeSlots: TimeSlot[];
  userSelectedLocations?: string[];
  onLocationClick?: (location: string) => void;
  onTimeSlotClick?: (timeSlot: TimeSlot) => void;
  children?: React.ReactNode;
  isMyEvent?: boolean;
}

const DefaultEventBody: React.FC<DefaultEventBodyProps> = ({
  event,
  timeSlots,
  userSelectedLocations,
  onLocationClick,
  onTimeSlotClick,
  children,
  isMyEvent = false,
}) => {
  return (
    <div className="card-body pt-2">
      <EventLocations
        locations={event.locations}
        selectedLocations={event.confirmation?.location ? [event.confirmation.location] : undefined}
        userSelectedLocations={userSelectedLocations}
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
                    <td>
                      <UserDisplay
                        userId={jr.userId || ''}
                        fallback="Unknown User"
                      />
                    </td>
                    <td>
                      {jr.isRejected === false ? (
                        <span className="badge text-bg-success" style={BADGE_STYLES}>Accepted</span>
                      ) : jr.isRejected === true ? (
                        <span className="badge text-bg-danger" style={BADGE_STYLES}>Rejected</span>
                      ) : (
                        <span className="badge text-bg-warning" style={BADGE_STYLES}>Waiting</span>
                      )}
                    </td>
                    <td>{(jr.locations || []).join(', ')}</td>
                    <td>{(jr.timeSlots || []).map(ts => formatTimeSlotLocalized(ts)).join(', ')}</td>
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
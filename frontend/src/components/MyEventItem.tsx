import React from 'react';
import { components } from '../types/schema';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';

type ApiEvent = components['schemas']['ApiEvent'];

interface Props {
  event: ApiEvent;
  onDelete: (id: string) => Promise<void>;
}

const MyEventItem: React.FC<Props> = ({ event, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await onDelete(event.id || '');
    }
  };

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, event.confirmation, true));  

  return (
    <BaseEventItem
      event={event}
      headerTitle="Your Event"
      colorClass="text-primary"
      borderColorClass="border-primary"
      timeSlots={timeSlots}
      timestamp={moment(event.createdAt || '')}
      actionButton={{
        variant: 'outline-danger',
        icon: 'bi-x-circle',
        label: 'Cancel',
        onClick: handleDelete
      }}
      defaultCollapsed={true}
    >
      {event.joinRequests && event.joinRequests.length > 0 && (
        <div className="mt-4">
          <h6 className="mb-3 text-muted">Players Who Joined</h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Locations</th>
                  <th>Timeslots</th>
                </tr>
              </thead>
              <tbody>
                {event.joinRequests.map(jr => (
                  <tr key={jr.id}>
                    <td>{jr.userId || 'Unknown'}</td>
                    <td>{(jr.locations || []).join(', ')}</td>
                    <td>{(jr.timeSlots || []).map(ts => moment(ts).format('MMM D, h:mm A')).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </BaseEventItem>
  );
};

export default MyEventItem; 
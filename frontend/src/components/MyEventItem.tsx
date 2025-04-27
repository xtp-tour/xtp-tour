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
    />
  );
};

export default MyEventItem; 
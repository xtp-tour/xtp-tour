import React, { useState } from 'react';
import { components } from '../types/schema';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import { Modal, Button } from 'react-bootstrap';

type ApiEvent = components['schemas']['ApiEvent'];

interface Props {
  event: ApiEvent;
  onDelete: (id: string) => Promise<void>;
}

const MyEventItem: React.FC<Props> = ({ event, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, event.confirmation, true));  

  const handleDelete = async () => {
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(event.id || '');
    } finally {
      setDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5">
            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
            Cancel Event
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p>Are you sure you want to cancel this event?</p>
          {event.joinRequests && event.joinRequests.length > 0 && (
            <p className="text-danger mb-0">
              <i className="bi bi-people me-2"></i>
              There are players who have already joined this event. They will be notified about the cancellation.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="link"
            onClick={() => setShowModal(false)}
            disabled={deleting}
            className="text-decoration-none"
          >
            Keep Event
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cancelling...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Yes, Cancel Event
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MyEventItem; 
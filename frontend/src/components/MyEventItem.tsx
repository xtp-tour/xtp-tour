import React, { useState } from 'react';
import { components } from '../types/schema';
import BaseEventItem from './event/BaseEventItem';
import { TimeSlot, timeSlotFromDateAndConfirmation } from './event/types';
import moment from 'moment';
import { Modal, Button } from 'react-bootstrap';
import ConfirmEventModal from './ConfirmEventModal';

type ApiEvent = components['schemas']['ApiEvent'];

interface Props {
  event: ApiEvent;
  onDelete: (id: string) => Promise<void>;
  onEventUpdated?: () => void;
}

const MyEventItem: React.FC<Props> = ({ event, onDelete, onEventUpdated }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Convert event time slots to the format expected by BaseEventItem
  const timeSlots: TimeSlot[] = event.timeSlots.map(slot => timeSlotFromDateAndConfirmation(slot, event.confirmation, true));  

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(event.id || '');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleConfirmEvent = () => {
    setShowConfirmModal(true);
  };

  const handleEventConfirmed = () => {
    if (onEventUpdated) {
      onEventUpdated();
    }
  };

  // Determine if the event can be confirmed
  const canConfirmEvent = () => {
    return (event.status === 'OPEN' || event.status === 'ACCEPTED') && 
           !event.confirmation && 
           event.joinRequests && 
           event.joinRequests.length > 0;
  };

  // Get action button based on event status
  const getActionButton = () => {
    // No action button for confirmed events
    if (event.status === 'CONFIRMED') {
      return {
        variant: 'outline-secondary',
        icon: 'bi-check-circle-fill',
        label: 'Confirmed',
        onClick: () => {},
        disabled: true,
        hidden: true // This will be used to completely hide the button
      };
    }
    
    if (canConfirmEvent()) {
      return {
        variant: 'outline-success',
        icon: 'bi-check-circle',
        label: 'Confirm',
        onClick: handleConfirmEvent
      };
    }
    
    return {
      variant: 'outline-danger',
      icon: 'bi-x-circle',
      label: 'Cancel',
      onClick: handleDelete
    };
  };

  // Get color based on event status
  const getStatusColors = () => {
    if (event.status === 'CONFIRMED') {
      return {
        colorClass: 'text-success',
        borderColorClass: 'border-success'
      };
    }
    if (event.status === 'CANCELLED' || event.status === 'RESERVATION_FAILED') {
      return {
        colorClass: 'text-danger',
        borderColorClass: 'border-danger'
      };
    }
    return {
      colorClass: 'text-primary',
      borderColorClass: 'border-primary'
    };
  };

  const { colorClass, borderColorClass } = getStatusColors();

  return (
    <>
      <BaseEventItem
        event={event}
        headerTitle="Your Event"
        colorClass={colorClass}
        borderColorClass={borderColorClass}
        timeSlots={timeSlots}
        timestamp={moment(event.createdAt || '')}
        actionButton={getActionButton()}
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
      </BaseEventItem>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
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
            onClick={() => setShowDeleteModal(false)}
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

      {/* Confirm Event Modal */}
      <ConfirmEventModal
        event={event}
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirmed={handleEventConfirmed}
      />
    </>
  );
};

export default MyEventItem; 
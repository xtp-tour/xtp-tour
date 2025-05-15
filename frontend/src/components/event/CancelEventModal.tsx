import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { components } from '../../types/schema';

type ApiEvent = components['schemas']['ApiEvent'];

interface CancelEventModalProps {
  event: ApiEvent;
  show: boolean;
  onHide: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

const CancelEventModal: React.FC<CancelEventModalProps> = ({
  event,
  show,
  onHide,
  onConfirm,
  isDeleting
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
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
          onClick={onHide}
          disabled={isDeleting}
          className="text-decoration-none"
        >
          Keep Event
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? (
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
  );
};

export default CancelEventModal; 
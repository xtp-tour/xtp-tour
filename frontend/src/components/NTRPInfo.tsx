import React, { useState } from 'react';
import { Modal, Button, Badge, ListGroup } from 'react-bootstrap';
import { NTRP_DETAILED_DESCRIPTIONS, NTRP_RESOURCES } from './event/types';

interface NTRPInfoProps {
  show: boolean;
  onHide: () => void;
}

export const NTRPInfo: React.FC<NTRPInfoProps> = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>NTRP Rating System Guide</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <p className="lead">
            The National Tennis Rating Program (NTRP) is the official system used by the USTA 
            to classify tennis players by skill level, ensuring fair and competitive matches.
          </p>
        </div>

        <h5 className="mb-3">NTRP Levels Explained</h5>
        <ListGroup className="mb-4">
          {Object.entries(NTRP_DETAILED_DESCRIPTIONS).map(([level, description]) => (
            <ListGroup.Item key={level} className="d-flex justify-content-between align-items-center">
              <div>
                <Badge 
                  bg={parseFloat(level) <= 2.5 ? 'success' : 
                      parseFloat(level) <= 4.0 ? 'warning' : 
                      parseFloat(level) <= 5.5 ? 'danger' : 'dark'} 
                  className="me-3"
                >
                  {level}
                </Badge>
                {description}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <h5 className="mb-3">Skill Level Categories</h5>
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title text-success">Beginner (NTRP &lt; 3.5)</h6>
                <p className="card-text">
                  New to intermediate players who are learning fundamentals, 
                  developing basic strokes, and gaining court experience.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title text-warning">Intermediate (NTRP 3.5-5.0)</h6>
                <p className="card-text">
                  Consistent players with developed strokes, directional control, 
                  and strategic understanding of the game.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title text-danger">Advanced (NTRP &gt; 5.0)</h6>
                <p className="card-text">
                  Elite players with tournament experience, advanced skills, 
                  and the ability to execute complex strategies.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title text-info">Any Level</h6>
                <p className="card-text">
                  Open to all skill levels - great for social play, 
                  mixed-level groups, or coaching sessions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <h5 className="mb-3">Official USTA Resources</h5>
        <div className="d-grid gap-2">
          <a 
            href={NTRP_RESOURCES.USTA_OVERVIEW} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline-primary"
          >
            <i className="bi bi-info-circle me-2"></i>
            Understanding NTRP Ratings - Official USTA Guide
          </a>
          <a 
            href={NTRP_RESOURCES.USTA_FAQS} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline-primary"
          >
            <i className="bi bi-question-circle me-2"></i>
            NTRP Frequently Asked Questions
          </a>
          <a 
            href={NTRP_RESOURCES.USTA_SELF_RATE} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline-primary"
          >
            <i className="bi bi-clipboard-check me-2"></i>
            Self-Rate Your Tennis Level
          </a>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Hook for using NTRP info modal
export const useNTRPInfo = () => {
  const [showNTRPInfo, setShowNTRPInfo] = useState(false);

  const openNTRPInfo = () => setShowNTRPInfo(true);
  const closeNTRPInfo = () => setShowNTRPInfo(false);

  return {
    showNTRPInfo,
    openNTRPInfo,
    closeNTRPInfo,
    NTRPInfoModal: () => <NTRPInfo show={showNTRPInfo} onHide={closeNTRPInfo} />
  };
};
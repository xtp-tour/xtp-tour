import React, { useState, useEffect } from 'react';
import { Invitation } from '../services/domain/invitation';
import { AcceptInvitationModal } from './AcceptInvitationModal';
import { useAPI } from '../services/api/provider';
import { Location } from '../services/domain/locations';

interface Props {
  invitation: Invitation;
}

const AvailableInvitationItem: React.FC<Props> = ({ invitation }) => {
  const api = useAPI();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [locations, setLocations] = useState<Map<string, Location>>(new Map());
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!api) return;

      try {
        setLoadingLocations(true);
        const locationPromises = invitation.locations.map(id => api.getLocation(id));
        const locationResults = await Promise.all(locationPromises);
        const locationMap = new Map(locationResults.map(loc => [loc.id, loc]));
        setLocations(locationMap);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [api, invitation.locations]);

  return (
    <>
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="card-title">{invitation.invitationType} Invitation</h5>
              <h6 className="card-subtitle mb-2 text-muted">
                Skill Level: {invitation.skillLevel}
              </h6>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowAcceptModal(true)}
            >
              Accept
            </button>
          </div>

          <div className="mt-3">
            <div className="mb-2">
              <strong>Available Locations:</strong>
              {loadingLocations ? (
                <div className="text-muted">Loading locations...</div>
              ) : (
                <ul className="list-unstyled">
                  {invitation.locations.map(id => {
                    const location = locations.get(id);
                    return (
                      <li key={id}>
                        {location ? (
                          <span>
                            {location.name}
                            {location.address && (
                              <small className="text-muted ms-2">
                                <i className="bi bi-geo-alt me-1"></i>
                                {location.address}
                              </small>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">Unknown location</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <strong>Available Time Slots:</strong>
              <ul className="list-unstyled">
                {invitation.timeSlots.map((slot, index) => (
                  <li key={index}>
                    {slot.date.toLocaleDateString()} at {String(slot.time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {invitation.description && (
            <div className="mt-3">
              <strong>Description:</strong>
              <p className="mb-0">{invitation.description}</p>
            </div>
          )}

          <div className="mt-3 text-muted">
            <small>Posted on {invitation.createdAt.toLocaleString()}</small>
          </div>
        </div>
      </div>

      <AcceptInvitationModal
        show={showAcceptModal}
        onHide={() => setShowAcceptModal(false)}
        invitation={invitation}
      />
    </>
  );
};

export default AvailableInvitationItem; 
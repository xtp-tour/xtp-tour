import React, { useEffect, useState } from 'react';
import { Invitation } from '../services/domain/invitation';
import { useAPI } from '../services/api/provider';
import { Location } from '../services/domain/locations';

interface Props {
  invitation: Invitation;
  onCancel: (id: string) => void;
}

const AcceptedInvitationItem: React.FC<Props> = ({ invitation, onCancel }) => {
  const api = useAPI();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Map<string, Location>>(new Map());
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await api.getCurrentUserId();
        setCurrentUserId(userId);
      } catch (err) {
        console.error('Failed to get user ID:', err);
      }
    };

    fetchUserId();
  }, [api]);

  const currentUserAck = invitation.acks.find(ack => 
    ack.userId === currentUserId
  );

  useEffect(() => {
    const fetchLocations = async () => {
      if (!api || !currentUserAck) return;

      try {
        setLoadingLocations(true);
        const locationPromises = currentUserAck.locations.map(id => api.getLocation(id));
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
  }, [api, currentUserAck]);

  if (!currentUserAck) {
    return null;
  }

  return (
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
            className="btn btn-outline-danger btn-sm"
            onClick={() => onCancel(invitation.id)}
          >
            Cancel
          </button>
        </div>

        <div className="mt-3">
          <h6>Your Selected Options:</h6>
          <div className="mb-2">
            <strong>Locations:</strong>
            {loadingLocations ? (
              <div className="text-muted">Loading locations...</div>
            ) : (
              <ul className="list-unstyled">
                {currentUserAck.locations.map(id => {
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
            <strong>Time Slots:</strong>
            <ul className="list-unstyled">
              {currentUserAck.timeSlots.map((slot, index) => (
                <li key={index}>
                  {slot.date.toLocaleDateString()} at {String(slot.time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}
                </li>
              ))}
            </ul>
          </div>
          {currentUserAck.comment && (
            <div className="mt-2">
              <strong>Your Comment:</strong>
              <p className="mb-0">{currentUserAck.comment}</p>
            </div>
          )}
        </div>

        {invitation.description && (
          <div className="mt-3">
            <strong>Description:</strong>
            <p className="mb-0">{invitation.description}</p>
          </div>
        )}

        <div className="mt-3 text-muted">
          <small>Acknowledged on {currentUserAck.createdAt.toLocaleString()}</small>
        </div>
      </div>
    </div>
  );
};

export default AcceptedInvitationItem; 
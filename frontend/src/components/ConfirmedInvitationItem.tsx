import React, { useEffect, useState } from 'react';
import { Invitation } from '../services/domain/invitation';
import { useAPI } from '../services/api/provider';
import { Location } from '../services/domain/locations';

interface Props {
  invitation: Invitation;
}

const ConfirmedInvitationItem: React.FC<Props> = ({ invitation }) => {
  const api = useAPI();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

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

  useEffect(() => {
    const fetchLocation = async () => {
      if (!api || !invitation.reservation) return;

      try {
        setLoadingLocation(true);
        const locationData = await api.getLocation(invitation.reservation.location);
        setLocation(locationData);
      } catch (error) {
        console.error('Failed to fetch location:', error);
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchLocation();
  }, [api, invitation.reservation]);

  const isOwner = invitation.ownerId === currentUserId;
  const playerB = invitation.reservation?.playerBId;

  if (!invitation.reservation) {
    return null;
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title">{invitation.invitationType} Session</h5>
            <h6 className="card-subtitle mb-2 text-muted">
              Skill Level: {invitation.skillLevel}
            </h6>
          </div>
          <span className="badge bg-success">
            <i className="bi bi-calendar-check me-1"></i>
            Confirmed
          </span>
        </div>

        <div className="mt-3">
          <div className="mb-2">
            <strong>Players:</strong>
            <ul className="list-unstyled mt-1">
              <li>
                <i className="bi bi-person-circle text-primary me-2"></i>
                {isOwner ? 'You' : invitation.ownerId} (Host)
              </li>
              <li>
                <i className="bi bi-person-circle text-success me-2"></i>
                {playerB === currentUserId ? 'You' : playerB} (Guest)
              </li>
            </ul>
          </div>

          <div className="mb-2">
            <strong>Location:</strong>
            {loadingLocation ? (
              <div className="text-muted mt-1">Loading location...</div>
            ) : (
              <div className="mt-1">
                <i className="bi bi-geo-alt text-primary me-2"></i>
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
              </div>
            )}
          </div>

          <div>
            <strong>Time:</strong>
            <div className="mt-1">
              <i className="bi bi-clock text-primary me-2"></i>
              {invitation.reservation.date.toLocaleDateString()} at{' '}
              {String(invitation.reservation.time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}
              <span className="text-muted ms-2">
                ({invitation.reservation.duration} minutes)
              </span>
            </div>
          </div>
        </div>

        {invitation.description && (
          <div className="mt-3">
            <strong>Description:</strong>
            <p className="mb-0">{invitation.description}</p>
          </div>
        )}

        <div className="mt-3 text-muted">
          <small>Confirmed on {invitation.reservation.createdAt.toLocaleString()}</small>
        </div>
      </div>
    </div>
  );
};

export default ConfirmedInvitationItem; 
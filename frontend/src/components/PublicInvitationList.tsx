import React, { useEffect, useState } from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { useAPI } from '../services/apiProvider';
import { APIInvitation } from '../types/api';
import { Event, EventStatus } from '../types/event';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot } from './invitation/types';

const transformInvitation = (invitation: APIInvitation): Event => ({
  ...invitation,
  timeSlots: invitation.timeSlots.map(ts => ({
    date: new Date(ts.date),
    time: ts.time
  })),
  createdAt: new Date(invitation.createdAt)
});

const PublicInvitationList: React.FC = () => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Event[]>([]);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.listEvents();
        const availableInvitations = response.invitations
          .map(transformInvitation)
          .filter(inv => inv.status === EventStatus.Pending && inv.joinRequests.length === 0);
        setInvitations(availableInvitations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [api]);

  if (loading) {
    return (
      <div className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-muted text-center">No available invitations at the moment.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {invitations.map(invitation => {
        const timeSlots: TimeSlot[] = invitation.timeSlots.map(slot => ({
          date: slot.date,
          time: slot.time,
          isAvailable: true,
          isSelected: false
        }));

        return (
          <BaseInvitationItem
            key={invitation.id}
            invitation={invitation}
            headerTitle={invitation.ownerId}
            headerSubtitle="Looking for players"
            colorClass="text-primary"
            borderColorClass="border-primary"
            timeSlots={timeSlots}
            timestamp={invitation.createdAt}
            actionButton={{
              variant: 'outline-primary',
              icon: 'bi-box-arrow-in-right',
              label: 'Sign in to respond',
              customButton: (
                <SignInButton mode="modal">
                  <button className="btn btn-outline-primary" style={{ minWidth: '100px' }}>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign in to respond
                  </button>
                </SignInButton>
              )
            }}
          />
        );
      })}
    </div>
  );
};

export default PublicInvitationList; 
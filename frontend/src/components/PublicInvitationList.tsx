import React, { useEffect, useState } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { useAPI } from '../services/apiProvider';
import { components } from '../types/schema';
import BaseInvitationItem from './invitation/BaseInvitationItem';
import { TimeSlot } from './invitation/types';
import { AcceptInvitationModal } from './AcceptInvitationModal';
import moment from 'moment';

type Event = components['schemas']['ApiEvent'];

const transformInvitation = (invitation: Event): Event => ({
  ...invitation,
  timeSlots: invitation.timeSlots.map(ts => ts),
  createdAt: invitation.createdAt || new Date().toISOString()
});

const PublicInvitationList: React.FC = () => {
  const api = useAPI();
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Event[]>([]);
  const [selectedInvitation, setSelectedInvitation] = useState<Event | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listPublicEvents();
      const availableInvitations = response.events?.map(transformInvitation) || [];
      setInvitations(availableInvitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [api]);

  const handleJoin = (invitation: Event) => {
    setSelectedInvitation(invitation);
    setShowAcceptModal(true);
  };

  const handleAccepted = () => {
    setShowAcceptModal(false);
    setSelectedInvitation(null);
    // Refresh the list to show the updated state
    fetchInvitations();
  };

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
          date: moment(slot),
          isAvailable: true,
          isSelected: false
        }));

        const actionButton = isSignedIn ? {
          variant: 'outline-primary',
          icon: 'bi-plus-circle',
          label: 'Join',
          onClick: () => handleJoin(invitation)
        } : {
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
        };

        return (
          <BaseInvitationItem
            key={invitation.id}
            invitation={invitation}
            headerTitle={invitation.userId || 'Unknown User'}
            headerSubtitle="Looking for players"
            colorClass="text-primary"
            borderColorClass="border-primary"
            timeSlots={timeSlots}
            timestamp={moment(invitation.createdAt).toDate()}
            actionButton={actionButton}
          />
        );
      })}

      {selectedInvitation && selectedInvitation.id && (
        <AcceptInvitationModal
          invitationId={selectedInvitation.id}
          hostName={selectedInvitation.userId || 'Unknown User'}
          show={showAcceptModal}
          onHide={() => setShowAcceptModal(false)}
          onAccepted={handleAccepted}
        />
      )}
    </div>
  );
};

export default PublicInvitationList; 
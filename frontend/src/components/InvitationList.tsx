import React, { useEffect, useState } from 'react';
import MyInvitationItem from './MyInvitationItem';
import AvailableInvitationItem from './AvailableInvitationItem';
import AcceptedInvitationItem from './AcceptedInvitationItem';
import { useAPI } from '../services/apiProvider';
import { APIInvitation } from '../types/api';
import { Invitation, InvitationDate, InvitationStatus } from '../types/invitation';

const transformInvitation = (invitation: APIInvitation): Invitation => ({
  ...invitation,
  dates: invitation.dates.map((date): InvitationDate => ({
    ...date,
    date: new Date(date.date)
  })),
  createdAt: new Date(invitation.createdAt),
  updatedAt: invitation.updatedAt ? new Date(invitation.updatedAt) : undefined
});

const InvitationList: React.FC = () => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{ invitations: Invitation[]; total: number }>({ invitations: [], total: 0 });
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.listInvitations({ page, limit });
        setInvitationData({
          total: response.total,
          invitations: response.invitations.map(transformInvitation)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [api, page]);

  const myInvitations = invitationData.invitations.filter(invitation => 
    invitation.isOwner && invitation.status !== InvitationStatus.Accepted
  );
  
  const acceptedInvitations = invitationData.invitations.filter(invitation => 
    !invitation.isOwner && invitation.status === InvitationStatus.Accepted
  );
  
  const availableInvitations = invitationData.invitations.filter(invitation => 
    !invitation.isOwner && invitation.status === InvitationStatus.Pending
  );

  const handleLoadMore = () => {
    if (invitationData.invitations.length < invitationData.total) {
      setPage(prev => prev + 1);
    }
  };

  if (loading && page === 1) {
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

  return (
    <div className="mt-4">
      <section className="mb-5">
        <h2 className="h4 mb-4 pb-2 border-bottom text-primary">Your Invitations</h2>
        {myInvitations.length === 0 ? (
          <p className="text-muted">You haven't created any invitations yet.</p>
        ) : (
          <div>
            {myInvitations.map(invitation => (
              <MyInvitationItem 
                key={invitation.id} 
                invitation={invitation} 
                onDelete={async (id) => {
                  try {
                    await api.deleteInvitation(id);
                    setInvitationData(prev => ({
                      ...prev,
                      invitations: prev.invitations.filter(inv => inv.id !== id),
                      total: prev.total - 1
                    }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to delete invitation');
                  }
                }} 
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-5">
        <h2 className="h4 mb-4 pb-2 border-bottom text-primary">Accepted Invitations</h2>
        {acceptedInvitations.length === 0 ? (
          <p className="text-muted">You haven't accepted any invitations yet.</p>
        ) : (
          <div>
            {acceptedInvitations.map(invitation => (
              <AcceptedInvitationItem key={invitation.id} invitation={invitation} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-5">
        <h2 className="h4 mb-4 pb-2 border-bottom text-primary">Available Invitations to Join</h2>
        {availableInvitations.length === 0 ? (
          <p className="text-muted">No available invitations at the moment.</p>
        ) : (
          <div>
            {availableInvitations.map(invitation => (
              <AvailableInvitationItem key={invitation.id} invitation={invitation} />
            ))}
          </div>
        )}
      </section>

      {loading && page > 1 && (
        <div className="text-center mb-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading more...</span>
          </div>
        </div>
      )}

      {invitationData.invitations.length < invitationData.total && !loading && (
        <div className="text-center mb-4">
          <button className="btn btn-outline-primary" onClick={handleLoadMore}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default InvitationList; 
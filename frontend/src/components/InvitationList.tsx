import React, { useEffect, useState } from 'react';
import MyInvitationItem from './MyInvitationItem';
import AvailableInvitationItem from './AvailableInvitationItem';
import ConfirmedInvitationItem from './ConfirmedInvitationItem';
import AcceptedInvitationItem from './AcceptedInvitationItem';
import { useAPI } from '../services/api/provider';
import { Invitation, InvitationStatus, AckStatus } from '../services/domain/invitation';

interface SectionHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, isExpanded, onToggle }) => (
  <div 
    className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom text-primary cursor-pointer"
    onClick={onToggle}
    style={{ cursor: 'pointer' }}
  >
    <div className="d-flex align-items-center gap-2">
      <h2 className="h4 mb-0">{title}</h2>
      <span className="badge bg-primary rounded-pill">{count}</span>
    </div>
    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} fs-4`}></i>
  </div>
);

const InvitationList: React.FC = () => {
  const api = useAPI();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const limit = 10;

  // State for section expansion
  const [expandedSections, setExpandedSections] = useState({
    myInvitations: true,
    acceptedInvitations: true,
    availableInvitations: true,
    confirmedInvitations: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    // Skip if API is not ready
    if (!api) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user ID
        try {
          const userId = await api.getCurrentUserId();
          if (!userId) {
            throw new Error('User ID not available');
          }
          setCurrentUserId(userId);
        } catch (err) {
          console.error('Failed to get user ID:', err);
          setError('Failed to get user ID. Please try refreshing the page.');
          return;
        }

        // Fetch invitations
        try {
          const response = await api.listInvitations({ page, limit });
          
          if (!response || !Array.isArray(response.invitations)) {
            throw new Error('Invalid response format from API');
          }

          // Get full domain invitations
          const domainInvitations = await Promise.all(
            response.invitations.map(inv => api.getInvitation(inv.id))
          );
          setInvitations(prev => page === 1 ? domainInvitations : [...prev, ...domainInvitations]);
          setTotal(response.total || 0);
        } catch (err) {
          console.error('Failed to fetch invitations:', err);
          setError('Failed to load invitations. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, page]);

  // Only compute filtered lists if we have a valid currentUserId
  const myInvitations = currentUserId ? invitations.filter(invitation => 
    invitation.ownerId === currentUserId && 
    invitation.status !== InvitationStatus.Confirmed &&
    invitation.status !== InvitationStatus.Cancelled
  ) : [];
  
  const availableInvitations = currentUserId ? invitations.filter(invitation => 
    invitation.ownerId !== currentUserId && 
    invitation.status === InvitationStatus.Pending &&
    !invitation.acks.some(ack => ack.userId === currentUserId)
  ) : [];

  const acceptedInvitations = currentUserId ? invitations.filter(invitation =>
    invitation.ownerId !== currentUserId &&
    invitation.status === InvitationStatus.Pending &&
    invitation.acks.some(ack => 
      ack.userId === currentUserId && 
      ack.status === AckStatus.Pending
    )
  ) : [];

  const confirmedInvitations = currentUserId ? invitations.filter(invitation =>
    invitation.status === InvitationStatus.Confirmed &&
    (invitation.ownerId === currentUserId ||
     invitation.reservation?.playerBId === currentUserId)
  ) : [];

  const handleLoadMore = () => {
    if (invitations.length < total) {
      setPage(prev => prev + 1);
    }
  };

  // Show loading state if API is not ready or we're loading first page
  if (!api || (loading && page === 1)) {
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
        <div className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button 
          className="btn btn-outline-danger btn-sm mt-2"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <section className="mb-5">
        <SectionHeader
          title="Your Invitations"
          count={myInvitations.length}
          isExpanded={expandedSections.myInvitations}
          onToggle={() => toggleSection('myInvitations')}
        />
        {expandedSections.myInvitations && (
          myInvitations.length === 0 ? (
            <p className="text-muted">
              {!currentUserId ? 'Loading...' : "You haven't created any invitations yet."}
            </p>
          ) : (
            <div>
              {myInvitations.map(invitation => (
                <MyInvitationItem 
                  key={invitation.id} 
                  invitation={invitation} 
                  onDelete={async (id) => {
                    try {
                      await api.deleteInvitation(id);
                      setInvitations(prev => prev.filter(inv => inv.id !== id));
                      setTotal(prev => prev - 1);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to delete invitation');
                    }
                  }}
                />
              ))}
            </div>
          )
        )}
      </section>

      <section className="mb-5">
        <SectionHeader
          title="Accepted Invitations"
          count={acceptedInvitations.length}
          isExpanded={expandedSections.acceptedInvitations}
          onToggle={() => toggleSection('acceptedInvitations')}
        />
        {expandedSections.acceptedInvitations && (
          acceptedInvitations.length === 0 ? (
            <p className="text-muted">No accepted invitations yet.</p>
          ) : (
            <div>
              {acceptedInvitations.map(invitation => (
                <AcceptedInvitationItem 
                  key={invitation.id} 
                  invitation={invitation}
                  onCancel={async (id) => {
                    try {
                      await api.cancelAck(id);
                      setInvitations(prev => prev.map(inv =>
                        inv.id === id
                          ? {
                              ...inv,
                              acks: inv.acks.map(ack =>
                                ack.userId === currentUserId
                                  ? { ...ack, status: AckStatus.Cancelled }
                                  : ack
                              )
                            }
                          : inv
                      ));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to cancel acknowledgment');
                    }
                  }}
                />
              ))}
            </div>
          )
        )}
      </section>

      <section className="mb-5">
        <SectionHeader
          title="Confirmed Sessions"
          count={confirmedInvitations.length}
          isExpanded={expandedSections.confirmedInvitations}
          onToggle={() => toggleSection('confirmedInvitations')}
        />
        {expandedSections.confirmedInvitations && (
          confirmedInvitations.length === 0 ? (
            <p className="text-muted">No confirmed sessions yet.</p>
          ) : (
            <div>
              {confirmedInvitations.map(invitation => (
                <ConfirmedInvitationItem key={invitation.id} invitation={invitation} />
              ))}
            </div>
          )
        )}
      </section>

      <section className="mb-5">
        <SectionHeader
          title="Available Invitations to Join"
          count={availableInvitations.length}
          isExpanded={expandedSections.availableInvitations}
          onToggle={() => toggleSection('availableInvitations')}
        />
        {expandedSections.availableInvitations && (
          availableInvitations.length === 0 ? (
            <p className="text-muted">No available invitations at the moment.</p>
          ) : (
            <div>
              {availableInvitations.map(invitation => (
                <AvailableInvitationItem 
                  key={invitation.id} 
                  invitation={invitation}
                />
              ))}
            </div>
          )
        )}
      </section>

      {loading && page > 1 && (
        <div className="text-center mb-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading more...</span>
          </div>
        </div>
      )}

      {invitations.length < total && !loading && (
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
import React, { useEffect, useState } from 'react';
import MyInvitationItem from './MyInvitationItem';
import AvailableInvitationItem from './AvailableInvitationItem';
import ConfirmedInvitationItem from './ConfirmedInvitationItem';
import { useAPI } from '../services/api/provider';
import { APIInvitation } from '../services/api/types';
import { Invitation, InvitationStatus } from '../services/domain/invitation';

const transformInvitation = (invitation: APIInvitation): Invitation => ({
  id: invitation.id,
  ownerId: invitation.ownerId,
  locations: invitation.locations,
  skillLevel: invitation.skillLevel,
  invitationType: invitation.invitationType,
  requestType: invitation.requestType,
  sessionDuration: invitation.sessionDuration,
  description: invitation.description,
  isOwner: invitation.isOwner,
  status: invitation.status,
  timeSlots: invitation.dates.map(d => ({
    ...d,
    date: new Date(d.date)
  })),
  createdAt: new Date(invitation.createdAt),
  updatedAt: invitation.updatedAt ? new Date(invitation.updatedAt) : undefined,
  selectedLocations: invitation.selectedLocations,
  selectedTimeSlots: invitation.selectedTimeSlots
});

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
  const [invitationData, setInvitationData] = useState<{ invitations: Invitation[]; total: number }>({ invitations: [], total: 0 });
  const [page, setPage] = useState(1);
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
    invitation.isOwner && invitation.status !== InvitationStatus.Confirmed
  );
  
  const availableInvitations = invitationData.invitations.filter(invitation => 
    !invitation.isOwner && invitation.status === InvitationStatus.Pending
  );

  const confirmedInvitations = invitationData.invitations.filter(invitation =>
    invitation.status === InvitationStatus.Confirmed
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
        <SectionHeader
          title="Your Invitations"
          count={myInvitations.length}
          isExpanded={expandedSections.myInvitations}
          onToggle={() => toggleSection('myInvitations')}
        />
        {expandedSections.myInvitations && (
          myInvitations.length === 0 ? (
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
                  onConfirm={() => {
                    setInvitationData(prev => ({
                      ...prev,
                      invitations: prev.invitations.map(inv =>
                        inv.id === invitation.id
                          ? { ...inv, status: InvitationStatus.Confirmed }
                          : inv
                      )
                    }));
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
                  onAccept={() => {
                    // TODO: Implement invitation acceptance callback
                  }}
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
import React, { useEffect, useState } from 'react';
import MyInvitationItem from './MyInvitationItem';
import AvailableInvitationItem from './AvailableInvitationItem';
import AcceptedInvitationItem from './AcceptedInvitationItem';
import { useAPI } from '../services/apiProvider';
import { APIInvitation } from '../types/api';
import { Invitation, InvitationStatus } from '../types/invitation';

const transformInvitation = (invitation: APIInvitation): Invitation => ({
  ...invitation,
  timeSlots: invitation.timeSlots.map(ts => ({
    date: new Date(ts.date),
    time: ts.time
  })),
  createdAt: new Date(invitation.createdAt)
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
  const [myInvitations, setMyInvitations] = useState<Invitation[]>([]);
  const [otherInvitations, setOtherInvitations] = useState<Invitation[]>([]);

  // State for section expansion
  const [expandedSections, setExpandedSections] = useState({
    myInvitations: true,
    acceptedInvitations: true,
    availableInvitations: true
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
        
        // Fetch both my invitations and other invitations
        const [myResponse, otherResponse] = await Promise.all([
          api.listMyInvitations(),
          api.listInvitations()
        ]);

        setMyInvitations(myResponse.invitations.map(transformInvitation));
        setOtherInvitations(otherResponse.invitations.map(transformInvitation));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [api]);

  // Filter invitations based on their status
  const pendingMyInvitations = myInvitations.filter(invitation => 
    invitation.status === InvitationStatus.Pending
  );
  
  const acceptedInvitations = otherInvitations.filter(invitation => 
    invitation.acks.length > 0
  );
  
  const availableInvitations = otherInvitations.filter(invitation => 
    invitation.status === InvitationStatus.Pending &&
    invitation.acks.length===0
  );

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

  return (
    <div className="mt-4">
      <section className="mb-5">
        <SectionHeader
          title="Your Invitations"
          count={pendingMyInvitations.length}
          isExpanded={expandedSections.myInvitations}
          onToggle={() => toggleSection('myInvitations')}
        />
        {expandedSections.myInvitations && (
          pendingMyInvitations.length === 0 ? (
            <p className="text-muted">You haven't created any invitations yet.</p>
          ) : (
            <div>
              {pendingMyInvitations.map(invitation => (
                <MyInvitationItem 
                  key={invitation.id} 
                  invitation={invitation} 
                  onDelete={async (id) => {
                    try {
                      await api.deleteInvitation(id);
                      setMyInvitations(prev => prev.filter(inv => inv.id !== id));
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
            <p className="text-muted">You haven't accepted any invitations yet.</p>
          ) : (
            <div>
              {acceptedInvitations.map(invitation => (
                <AcceptedInvitationItem key={invitation.id} invitation={invitation} />
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
    </div>
  );
};

export default InvitationList; 
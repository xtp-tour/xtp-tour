import React, { useEffect, useState } from 'react';
import { Invitation } from '../types/invitation';
import MyInvitationItem from './MyInvitationItem';
import AvailableInvitationItem from './AvailableInvitationItem';

// Mock data - this would normally come from an API
const mockInvitations: Invitation[] = [
  {
    id: '1',
    playerName: 'John Doe',
    dates: [
      {
        date: new Date('2024-03-20'),
        timespan: { from: 1000, to: 1200 }
      },
      {
        date: new Date('2024-03-22'),
        timespan: { from: 1400, to: 1600 }
      }
    ],
    location: 'Central Tennis Club',
    skillLevel: 'Intermediate',
    isOwner: true
  },
  {
    id: '2',
    playerName: 'Jane Smith',
    dates: [
      {
        date: new Date('2024-03-21'),
        timespan: { from: 900, to: 1100 }
      }
    ],
    location: 'West Park Courts',
    skillLevel: 'Advanced',
    isOwner: false
  },
  {
    id: '3',
    playerName: 'Mike Johnson',
    dates: [
      {
        date: new Date('2024-03-22'),
        timespan: { from: 1600, to: 1800 }
      },
      {
        date: new Date('2024-03-23'),
        timespan: { from: 1000, to: 1200 }
      }
    ],
    location: 'East Tennis Center',
    skillLevel: 'Beginner',
    isOwner: false
  },
  {
    id: '4',
    playerName: 'Current User',
    dates: [
      {
        date: new Date('2024-03-23'),
        timespan: { from: 1400, to: 1600 }
      }
    ],
    location: 'South Park Courts',
    skillLevel: 'Intermediate',
    isOwner: true
  }
];

const InvitationList: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    // Mock API call
    const fetchInvitations = async () => {
      // In real implementation, this would be an API call
      setInvitations(mockInvitations);
    };

    fetchInvitations();
  }, []);

  const myInvitations = invitations.filter(invitation => invitation.isOwner);
  const availableInvitations = invitations.filter(invitation => !invitation.isOwner);

  return (
    <div className="mt-4">
      <section className="mb-5">
        <h2 className="h4 mb-4 pb-2 border-bottom text-primary">Your Invitations</h2>
        {myInvitations.length === 0 ? (
          <p className="text-muted">You haven't created any invitations yet.</p>
        ) : (
          myInvitations.map(invitation => (
            <MyInvitationItem key={invitation.id} invitation={invitation} />
          ))
        )}
      </section>

      <section className="mb-5">
        <h2 className="h4 mb-4 pb-2 border-bottom text-primary">Available Invitations to Join</h2>
        {availableInvitations.length === 0 ? (
          <p className="text-muted">No available invitations at the moment.</p>
        ) : (
          availableInvitations.map(invitation => (
            <AvailableInvitationItem key={invitation.id} invitation={invitation} />
          ))
        )}
      </section>
    </div>
  );
};

export default InvitationList; 
import React, { useEffect, useState } from 'react';
import { GameRequest } from '../types/Invite';
import MyInviteItem from './MyInviteItem';
import InviteItem from './InviteItem';

// Mock data - this would normally come from an API
const mockGameRequests: GameRequest[] = [
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

const GameRequestList: React.FC = () => {
  const [gameRequests, setGameRequests] = useState<GameRequest[]>([]);

  useEffect(() => {
    // Mock API call
    const fetchGameRequests = async () => {
      // In real implementation, this would be an API call
      setGameRequests(mockGameRequests);
    };

    fetchGameRequests();
  }, []);

  const myRequests = gameRequests.filter(request => request.isOwner);
  const availableRequests = gameRequests.filter(request => !request.isOwner);

  return (
    <div className="game-requests-list">
      <section className="my-requests">
        <h2>Your Game Requests</h2>
        {myRequests.length === 0 ? (
          <p>You haven't created any game requests yet.</p>
        ) : (
          myRequests.map(request => (
            <MyInviteItem key={request.id} request={request} />
          ))
        )}
      </section>

      <section className="available-requests">
        <h2>Available Games to Join</h2>
        {availableRequests.length === 0 ? (
          <p>No available game requests at the moment.</p>
        ) : (
          availableRequests.map(request => (
            <InviteItem key={request.id} request={request} />
          ))
        )}
      </section>
    </div>
  );
};

export default GameRequestList; 
import React from 'react';
import { GameRequest } from '../types/GameRequest';

interface AvailableGameRequestItemProps {
  request: GameRequest;
}

const AvailableGameRequestItem: React.FC<AvailableGameRequestItemProps> = ({ request }) => {
  const handleJoin = async () => {
    try {
      // Mock API call - replace with actual API endpoint when ready
      const response = await fetch(`/api/games/${request.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to join game');
      }

      // Handle successful join
      console.log('Successfully joined the game');
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="card mb-3 border-start border-4 border-primary">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 mb-0 text-primary">{request.playerName}</h3>
          <span className="badge bg-primary">{request.skillLevel}</span>
        </div>
        
        <div className="mb-3">
          {request.dates.map((dateItem, index) => (
            <div key={index} className="bg-white rounded p-2 mb-2 shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-semibold text-secondary" style={{ minWidth: '100px' }}>
                  {formatDate(dateItem.date)}
                </span>
                <span className="text-body">
                  {formatTime(dateItem.timespan.from)} - {formatTime(dateItem.timespan.to)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-3">
          <span className="fw-semibold text-secondary">Location:</span>{' '}
          {request.location}
        </p>

        <div className="mt-3">
          <button 
            className="btn btn-primary"
            onClick={handleJoin}
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailableGameRequestItem; 
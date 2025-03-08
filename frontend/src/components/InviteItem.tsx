import React from 'react';
import { GameRequest } from '../types/Invite';

interface AvailableGameRequestItemProps {
  request: GameRequest;
}

const InviteItem: React.FC<AvailableGameRequestItemProps> = ({ request }) => {
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
    <div className="game-request-card available-game-request">
      <div className="game-request-header">
        <h3>{request.playerName}</h3>
        <span className="skill-badge">{request.skillLevel}</span>
      </div>
      
      <div className="dates-list">
        {request.dates.map((dateItem, index) => (
          <div key={index} className="date-item">
            <span className="date">{formatDate(dateItem.date)}</span>
            <span className="time">
              {formatTime(dateItem.timespan.from)} - {formatTime(dateItem.timespan.to)}
            </span>
          </div>
        ))}
      </div>

      <p className="location">
        <span className="label">Location:</span> {request.location}
      </p>

      <div className="card-actions">
        <button 
          className="button button-primary"
          onClick={handleJoin}
        >
          Join Game
        </button>
      </div>
    </div>
  );
};

export default InviteItem; 
import React from 'react';
import { GameRequest } from '../types/Invite';

interface MyInviteItemProps {
  request: GameRequest;
}

const MyInviteItem: React.FC<MyInviteItemProps> = ({ request }) => {
  const handleCancel = async () => {
    try {
      // Mock API call - replace with actual API endpoint when ready
      const response = await fetch(`/api/games/${request.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel game request');
      }

      // Handle successful cancellation
      console.log('Game request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling game request:', error);
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
    <div className="game-request-card my-game-request">
      <div className="game-request-header">
        <h3>Your Request</h3>
        <span className="status-badge">Active</span>
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
      
      <p className="skill-level">
        <span className="label">Skill Level:</span> {request.skillLevel}
      </p>

      <div className="card-actions">
        <button 
          className="button button-secondary"
          onClick={handleCancel}
        >
          Cancel Request
        </button>
      </div>
    </div>
  );
};

export default MyInviteItem; 
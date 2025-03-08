import React from 'react';
import { GameRequest } from '../types/GameRequest';

interface MyGameRequestItemProps {
  request: GameRequest;
}

const MyGameRequestItem: React.FC<MyGameRequestItemProps> = ({ request }) => {
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
    <div className="card mb-3 border-start border-4 border-success">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 mb-0 text-success">Your Request</h3>
          <span className="badge bg-success">Active</span>
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

        <p className="mb-2">
          <span className="fw-semibold text-secondary">Location:</span>{' '}
          {request.location}
        </p>
        
        <p className="mb-3">
          <span className="fw-semibold text-secondary">Skill Level:</span>{' '}
          {request.skillLevel}
        </p>

        <div className="mt-3">
          <button 
            className="btn btn-outline-danger"
            onClick={handleCancel}
          >
            Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyGameRequestItem; 
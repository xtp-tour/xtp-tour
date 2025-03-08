import React from 'react';

const CreateGameRequest: React.FC = () => {
  const handleCreateRequest = async () => {
    try {
      // Mock API call - replace with actual API endpoint when ready
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // This will be populated with form data later
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game request');
      }

      // Handle successful creation
      console.log('Game request created successfully');
    } catch (error) {
      console.error('Error creating game request:', error);
    }
  };

  return (
    <div className="create-game-form">
      <button 
        className="button button-primary" 
        onClick={handleCreateRequest}
      >
        Create Game Request
      </button>
    </div>
  );
};

export default CreateGameRequest; 
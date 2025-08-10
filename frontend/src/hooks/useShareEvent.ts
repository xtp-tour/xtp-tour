import { useState } from 'react';

interface UseShareEventProps {
  eventId: string;
  onSuccess?: () => void;
}

export const useShareEvent = ({ eventId, onSuccess }: UseShareEventProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const shareEvent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      setIsSharing(true);
      const eventUrl = `${window.location.origin}/event/${eventId}`;
      await navigator.clipboard.writeText(eventUrl);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to share event:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return {
    shareEvent,
    isSharing
  };
};
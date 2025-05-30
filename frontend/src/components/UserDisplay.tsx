import React, { useState, useEffect } from 'react';
import { useAPI } from '../services/apiProvider';
import { ApiUserProfileData } from '../types/api';

interface UserDisplayProps {
  userId: string;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
  showAsPlainText?: boolean;
}

export const UserDisplay: React.FC<UserDisplayProps> = ({ 
  userId, 
  fallback = 'Unknown User', 
  className, 
  style,
  showAsPlainText = false 
}) => {
  const api = useAPI();
  const [profile, setProfile] = useState<ApiUserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.getUserProfileByUserId(userId);
        setProfile(response.profile || null);
      } catch (err) {
        console.warn(`Failed to fetch profile for user ${userId}:`, err);
        setError(true);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [userId, api]);

  const getDisplayName = (): string => {
    if (!profile) {
      return fallback;
    }

    // If user has a username, use it
    if (profile.username) {
      return profile.username;
    }

    // Otherwise, use first name + last name
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }

    // Fallback to just first name if available
    if (profile.firstName) {
      return profile.firstName;
    }

    return fallback;
  };

  if (loading && !showAsPlainText) {
    return (
      <span className={className} style={style}>
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        Loading...
      </span>
    );
  }

  const displayName = getDisplayName();

  if (showAsPlainText || loading || error) {
    return (
      <span className={className} style={style}>
        {displayName}
      </span>
    );
  }

  return (
    <span className={className} style={style} title={displayName}>
      {displayName}
    </span>
  );
};

export default UserDisplay; 
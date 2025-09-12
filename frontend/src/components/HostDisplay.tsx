import React, { useState, useEffect } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAPI } from '../services/apiProvider';
import { ApiUserProfileData } from '../types/api';
import { useTranslation } from 'react-i18next';

interface HostDisplayProps {
  userId: string;
  fallback?: string;
  className?: string;
  maxWidth?: string;
  showAsPlainText?: boolean;
}

const HostDisplay: React.FC<HostDisplayProps> = ({ 
  userId, 
  fallback, 
  className = '',
  maxWidth = '300px',
  showAsPlainText = false
}) => {
  const { t } = useTranslation();
  const api = useAPI();
  const defaultFallback = fallback || t('host.unknown');
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
      return defaultFallback;
    }

    // Use first name + last name
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }

    // Fallback to just first name if available
    if (profile.firstName) {
      return profile.firstName;
    }

    // Fallback to just last name if available
    if (profile.lastName) {
      return profile.lastName;
    }

    return defaultFallback;
  };

  const displayName = getDisplayName();

  // Simple text version for loading or when requested
  if (showAsPlainText || loading || error) {
    return (
      <span className={className}>
        <span className="text-muted">{t('host.label')}</span> {loading ? t('common.loading') : displayName}
      </span>
    );
  }

  // Avatar + name version with truncation and tooltip
  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <span >{t('host.label')}</span>
      <div className="d-flex align-items-center gap-2 min-width-0" style={{ maxWidth }}>
        {/* Avatar circle */}
        <div className="flex-shrink-0">
          <div 
            className="rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted"
            style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
        </div>
        {/* Name with truncation and tooltip */}
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`host-tooltip-${userId}`}>{displayName}</Tooltip>}
        >
          <span 
            className="text-truncate" 
            style={{ 
              minWidth: 0,
              maxWidth: '100%',
              display: 'block'
            }}
          >
            {displayName}
          </span>
        </OverlayTrigger>
      </div>
    </div>
  );
};

export default HostDisplay;
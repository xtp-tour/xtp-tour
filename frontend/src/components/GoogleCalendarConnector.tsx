import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPI } from '../services/apiProvider';
import { CalendarConnectionStatusResponse } from '../types/api';

interface GoogleCalendarConnectorProps {
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
  showPreferences?: boolean;
}

const GoogleCalendarConnector: React.FC<GoogleCalendarConnectorProps> = ({
  onConnectionChange,
  className = '',
  showPreferences = false
}) => {
  const { t } = useTranslation();
  const api = useAPI();
  
  const [connectionStatus, setConnectionStatus] = useState<CalendarConnectionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    syncEnabled: true,
    syncFrequencyMinutes: 30,
    showEventDetails: false
  });

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Notify parent of connection changes
  useEffect(() => {
    if (onConnectionChange && connectionStatus) {
      onConnectionChange(connectionStatus.connected);
    }
  }, [connectionStatus, onConnectionChange]);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await api.getCalendarConnectionStatus();
      setConnectionStatus(status);
      
      if (status.connected && showPreferences) {
        const prefs = await api.getCalendarPreferences();
        setPreferences(prefs);
      }
    } catch (err) {
      console.error('Failed to check calendar connection status:', err);
      setError(t('calendar.errors.connectionCheck'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authResponse = await api.getCalendarAuthURL();
      
      // Open OAuth URL in a new window
      const authWindow = window.open(
        authResponse.authUrl,
        'google-calendar-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'CALENDAR_AUTH_SUCCESS') {
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
          
          // Handle the callback
          api.handleCalendarCallback({
            code: event.data.code,
            state: event.data.state
          }).then(() => {
            checkConnectionStatus();
          }).catch((err) => {
            console.error('Failed to handle calendar callback:', err);
            setError(t('calendar.errors.authCallback'));
          });
        } else if (event.data.type === 'CALENDAR_AUTH_ERROR') {
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
          setError(event.data.error || t('calendar.errors.authFailed'));
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if window was closed manually
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to initiate calendar connection:', err);
      setError(t('calendar.errors.connectionFailed'));
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.disconnectCalendar();
      setConnectionStatus({ connected: false });
    } catch (err) {
      console.error('Failed to disconnect calendar:', err);
      setError(t('calendar.errors.disconnectFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async (newPrefs: typeof preferences) => {
    try {
      setError(null);
      await api.updateCalendarPreferences(newPrefs);
      setPreferences(newPrefs);
    } catch (err) {
      console.error('Failed to update calendar preferences:', err);
      setError(t('calendar.errors.preferencesUpdateFailed'));
    }
  };

  const renderConnectionStatus = () => {
    if (isLoading) {
      return (
        <div className="d-flex align-items-center">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span>{t('calendar.connecting')}</span>
        </div>
      );
    }

    if (!connectionStatus?.connected) {
      return (
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-calendar-x text-muted me-2"></i>
            <span className="text-muted">{t('calendar.notConnected')}</span>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleConnect}
            disabled={isLoading}
          >
            <i className="bi bi-google me-2"></i>
            {t('calendar.connect')}
          </button>
        </div>
      );
    }

    return (
      <div className="d-flex flex-column gap-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-calendar-check text-success me-2"></i>
            <span className="text-success">{t('calendar.connected')}</span>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            {t('calendar.disconnect')}
          </button>
        </div>
        
        {connectionStatus.provider && (
          <small className="text-muted">
            {t('calendar.provider')}: {connectionStatus.provider}
          </small>
        )}
      </div>
    );
  };

  const renderPreferences = () => {
    if (!showPreferences || !connectionStatus?.connected) {
      return null;
    }

    return (
      <div className="mt-3 pt-3 border-top">
        <h6 className="mb-3">{t('calendar.preferences.title')}</h6>
        
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="syncEnabled"
            checked={preferences.syncEnabled}
            onChange={(e) => handlePreferencesUpdate({
              ...preferences,
              syncEnabled: e.target.checked
            })}
          />
          <label className="form-check-label" htmlFor="syncEnabled">
            {t('calendar.preferences.syncEnabled')}
          </label>
        </div>

        <div className="mb-2">
          <label htmlFor="syncFrequency" className="form-label small">
            {t('calendar.preferences.syncFrequency')}
          </label>
          <select
            className="form-select form-select-sm"
            id="syncFrequency"
            value={preferences.syncFrequencyMinutes}
            onChange={(e) => handlePreferencesUpdate({
              ...preferences,
              syncFrequencyMinutes: parseInt(e.target.value)
            })}
          >
            <option value={15}>{t('calendar.preferences.every15min')}</option>
            <option value={30}>{t('calendar.preferences.every30min')}</option>
            <option value={60}>{t('calendar.preferences.every1hour')}</option>
          </select>
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="showEventDetails"
            checked={preferences.showEventDetails}
            onChange={(e) => handlePreferencesUpdate({
              ...preferences,
              showEventDetails: e.target.checked
            })}
          />
          <label className="form-check-label" htmlFor="showEventDetails">
            {t('calendar.preferences.showEventDetails')}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className={`google-calendar-connector ${className}`}>
      {renderConnectionStatus()}
      
      {error && (
        <div className="alert alert-danger alert-sm mt-2" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {renderPreferences()}
    </div>
  );
};

export default GoogleCalendarConnector;
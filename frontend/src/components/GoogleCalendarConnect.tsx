import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GoogleCalendarService from '../services/googleCalendarService';

interface GoogleCalendarConnectProps {
  onConnected: (service: GoogleCalendarService) => void;
  onDisconnected: () => void;
  isConnected: boolean;
}

const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  onConnected,
  onDisconnected,
  isConnected,
}) => {
  const { t } = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showAuthInput, setShowAuthInput] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setShowAuthInput(true);

    try {
      const service = new GoogleCalendarService({
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      });

      // Generate auth URL and open it
      const authUrl = await service.getAuthUrl();
      window.open(authUrl, '_blank', 'width=500,height=600');
    } catch (err) {
      setError(t('googleCalendar.errors.connectionFailed'));
      setShowAuthInput(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAuthCodeSubmit = async () => {
    if (!authCode.trim()) {
      setError(t('googleCalendar.errors.authCodeRequired'));
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const service = new GoogleCalendarService({
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      });

      const success = await service.exchangeCode(authCode.trim());
      if (success) {
        onConnected(service);
        setAuthCode('');
        setShowAuthInput(false);
      } else {
        setError(t('googleCalendar.errors.authenticationFailed'));
      }
    } catch (err) {
      setError(t('googleCalendar.errors.authenticationFailed'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnected();
    setShowAuthInput(false);
    setAuthCode('');
    setError(null);
  };

  const handleCancel = () => {
    setShowAuthInput(false);
    setAuthCode('');
    setError(null);
  };

  return (
    <div className="google-calendar-connect">
      <div className="d-flex align-items-center gap-2">
        {!isConnected ? (
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {t('googleCalendar.connecting')}
              </>
            ) : (
              <>
                <i className="bi bi-google me-2" />
                {t('googleCalendar.connect')}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleDisconnect}
          >
            <i className="bi bi-google me-2" />
            {t('googleCalendar.disconnect')}
          </button>
        )}
        
        {isConnected && (
          <span className="text-success">
            <i className="bi bi-check-circle me-1" />
            {t('googleCalendar.connected')}
          </span>
        )}
      </div>
      
      {showAuthInput && !isConnected && (
        <div className="mt-3 p-3 border rounded bg-light">
          <div className="mb-2">
            <small className="text-muted">
              {t('googleCalendar.authCodeInstructions')}
            </small>
          </div>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={t('googleCalendar.authCodePlaceholder')}
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuthCodeSubmit()}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAuthCodeSubmit}
              disabled={isConnecting || !authCode.trim()}
            >
              {isConnecting ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                t('googleCalendar.submit')
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleCancel}
              disabled={isConnecting}
            >
              {t('googleCalendar.cancel')}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger mt-2" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarConnect;
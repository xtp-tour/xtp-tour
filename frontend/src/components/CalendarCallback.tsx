import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../services/apiProvider';

const CalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const api = useAPI();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const handleCallback = async () => {
      let isPopup = false;
      try {
        isPopup = !!(window.opener && window.opener !== window && !window.opener.closed);
        console.log(`[CalendarCallback] Popup check: window.opener exists and is not closed. isPopup=${isPopup}`);
      } catch (e) {
        console.error('[CalendarCallback] Error checking for window.opener (this is expected due to cross-origin policies). Assuming this is a popup.', e);
        isPopup = true;
      }

      console.log(`[CalendarCallback] Starting... Is popup: ${isPopup}`);

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        console.log('[CalendarCallback] URL Params:', { code, state, error });

        if (error) {
          throw new Error(`OAuth error from provider: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state from provider.');
        }

        console.log('[CalendarCallback] Calling backend API with code and state...');
        await api.handleCalendarCallback({ code, state });
        console.log('[CalendarCallback] Backend API call successful!');

        setStatus('success');

        if (isPopup) {
          console.log('[CalendarCallback] Sending CALENDAR_AUTH_SUCCESS to parent window.');
          window.opener.postMessage({ type: 'CALENDAR_AUTH_SUCCESS' }, '*');
          setTimeout(() => {
            console.log('[CalendarCallback] Closing popup now (success).');
            window.close();
          }, 1000);
        } else {
          console.log('[CalendarCallback] Not a popup. Navigating home.');
          navigate('/', { replace: true });
        }
      } catch (err) {
        const detailedError = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('[CalendarCallback] Caught error during processing:', detailedError, err);
        setStatus('error');
        setErrorMessage(detailedError);

        if (isPopup) {
          console.log('[CalendarCallback] Sending CALENDAR_AUTH_ERROR to parent window.');
          window.opener.postMessage({ type: 'CALENDAR_AUTH_ERROR', error: detailedError }, '*');
          setTimeout(() => {
            console.log('[CalendarCallback] Closing popup now (error).');
            window.close();
          }, 3000); // Leave error visible for a few seconds
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, api]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              {status === 'processing' && (
                <>
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="card-title">Connecting Google Calendar</h5>
                  <p className="card-text">Please wait while we connect your Google Calendar...</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="text-success mb-3">
                    <i className="bi bi-check-circle-fill fs-1"></i>
                  </div>
                  <h5 className="card-title text-success">Calendar Connected!</h5>
                  <p className="card-text">Your Google Calendar has been successfully connected. Redirecting...</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="text-danger mb-3">
                    <i className="bi bi-x-circle-fill fs-1"></i>
                  </div>
                  <h5 className="card-title text-danger">Connection Failed</h5>
                  <p className="card-text">{errorMessage}</p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => navigate('/', { replace: true })}
                  >
                    Back to Home
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarCallback;

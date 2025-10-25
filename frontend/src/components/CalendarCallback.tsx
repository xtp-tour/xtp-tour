import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../services/apiProvider';

const CalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const api = useAPI();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage(`OAuth error: ${error}`);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setErrorMessage('Missing authorization code or state parameter');
          return;
        }

        // Forward the callback to the backend
        await api.handleCalendarCallback({ code, state });
        
        setStatus('success');
        // Redirect back to the main page after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(`Error processing callback: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
